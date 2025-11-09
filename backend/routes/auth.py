from fastapi import APIRouter, Depends, HTTPException, status, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
from models import User, PasswordHistory
from schemas import (
    LoginRequest, Token, RefreshTokenRequest, ChangePasswordRequest,
    ForgotPasswordRequest, ResetPasswordRequest, UserMeResponse
)
from security import (
    verify_password, get_password_hash, create_access_token, create_refresh_token,
    verify_token, check_password_strength, decrypt_field
)
from dependencies import get_current_user
from audit import log_audit, AuditAction
from config import settings
from email_service import send_password_reset_email, send_welcome_email
from rate_limit import limiter
import secrets

router = APIRouter(prefix="/auth", tags=["authentication"])

# Store password reset tokens in memory (in production, use Redis)
password_reset_tokens = {}


@router.post("/login", response_model=Token)
def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login endpoint"""
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user:
        log_audit(db, None, AuditAction.USER_LOGIN_FAILED, details={"email": login_data.email}, request=request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account locked until {user.locked_until}"
        )
    
    # Verify password
    if not verify_password(login_data.password, user.mot_de_passe_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.max_login_attempts:
            user.locked_until = datetime.utcnow() + timedelta(minutes=settings.lockout_duration_minutes)
        db.commit()
        log_audit(db, user.id, AuditAction.USER_LOGIN_FAILED, request=request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if password expired
    if user.mot_de_passe_expire_le and user.mot_de_passe_expire_le < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password has expired. Please reset your password."
        )
    
    # Reset failed attempts and update last login
    user.failed_login_attempts = 0
    user.locked_until = None
    user.date_derniere_connexion = datetime.utcnow()
    db.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "email": user.email})
    
    log_audit(db, user.id, AuditAction.USER_LOGIN, request=request)
    
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token"""
    payload = verify_token(refresh_data.refresh_token, is_refresh=True)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    if not user or not user.actif:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new tokens
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "email": user.email})
    
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_user),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Logout endpoint (audit log only, tokens are stateless)"""
    log_audit(db, current_user.id, AuditAction.USER_LOGOUT, request=request)
    return {"message": "Logged out successfully"}


@router.post("/change-password")
def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Change password"""
    # Verify current password
    if not verify_password(password_data.current_password, current_user.mot_de_passe_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Check password strength
    is_valid, message = check_password_strength(password_data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Check password history
    recent_passwords = db.query(PasswordHistory).filter(
        PasswordHistory.user_id == current_user.id
    ).order_by(PasswordHistory.created_at.desc()).limit(settings.password_history_count).all()
    
    for old_password in recent_passwords:
        if verify_password(password_data.new_password, old_password.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from your last 5 passwords"
            )
    
    # Add current password to history
    password_history = PasswordHistory(
        user_id=current_user.id,
        password_hash=current_user.mot_de_passe_hash
    )
    db.add(password_history)
    
    # Update password
    current_user.mot_de_passe_hash = get_password_hash(password_data.new_password)
    current_user.mot_de_passe_change_le = datetime.utcnow()
    current_user.mot_de_passe_expire_le = datetime.utcnow() + timedelta(days=settings.password_expire_days)
    
    # Clean old password history (keep only last N)
    old_passwords = db.query(PasswordHistory).filter(
        PasswordHistory.user_id == current_user.id
    ).order_by(PasswordHistory.created_at.desc()).offset(settings.password_history_count).all()
    for old_pwd in old_passwords:
        db.delete(old_pwd)
    
    db.commit()
    
    log_audit(db, current_user.id, AuditAction.PASSWORD_CHANGED, request=request)
    
    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
async def forgot_password(
    forgot_data: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Request password reset"""
    user = db.query(User).filter(User.email == forgot_data.email).first()
    
    # Don't reveal if user exists
    if user:
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        password_reset_tokens[reset_token] = {
            "user_id": user.id,
            "expires_at": datetime.utcnow() + timedelta(hours=1)
        }
        
        # Send email
        reset_url = f"{request.base_url}reset-password"
        await send_password_reset_email(user.email, reset_token, str(reset_url))
    
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
def reset_password(
    reset_data: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Reset password with token"""
    # Verify token
    token_data = password_reset_tokens.get(reset_data.token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    if token_data["expires_at"] < datetime.utcnow():
        del password_reset_tokens[reset_data.token]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check password strength
    is_valid, message = check_password_strength(reset_data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Add current password to history
    password_history = PasswordHistory(
        user_id=user.id,
        password_hash=user.mot_de_passe_hash
    )
    db.add(password_history)
    
    # Update password
    user.mot_de_passe_hash = get_password_hash(reset_data.new_password)
    user.mot_de_passe_change_le = datetime.utcnow()
    user.mot_de_passe_expire_le = datetime.utcnow() + timedelta(days=settings.password_expire_days)
    user.failed_login_attempts = 0
    user.locked_until = None
    
    # Clean old password history
    old_passwords = db.query(PasswordHistory).filter(
        PasswordHistory.user_id == user.id
    ).order_by(PasswordHistory.created_at.desc()).offset(settings.password_history_count).all()
    for old_pwd in old_passwords:
        db.delete(old_pwd)
    
    db.commit()
    
    # Remove token
    del password_reset_tokens[reset_data.token]
    
    log_audit(db, user.id, AuditAction.PASSWORD_RESET, request=request)
    
    return {"message": "Password reset successfully"}


@router.get("/me", response_model=UserMeResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    # Decrypt telephone if needed
    user_data = UserMeResponse.from_orm(current_user)
    if current_user.telephone:
        decrypted_phone = decrypt_field(db, current_user.telephone)
        user_data.telephone = decrypted_phone
    
    return user_data

