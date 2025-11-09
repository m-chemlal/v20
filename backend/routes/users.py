from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User
from schemas import UserCreate, UserUpdate, UserResponse
from dependencies import get_current_user, require_role
from security import get_password_hash, encrypt_field, decrypt_field
from audit import log_audit, AuditAction
from email_service import send_welcome_email
from datetime import datetime, timedelta
from config import settings

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get user by ID (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Decrypt telephone
    user_data = UserResponse.from_orm(user)
    if user.telephone:
        decrypted_phone = decrypt_field(db, user.telephone)
        user_data.telephone = decrypted_phone
    
    return user_data


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Create new user (admin only)"""
    # Check if email exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Encrypt telephone
    encrypted_phone = None
    if user_data.telephone:
        encrypted_phone = encrypt_field(db, user_data.telephone)
    
    # Create user
    new_user = User(
        email=user_data.email,
        mot_de_passe_hash=get_password_hash(user_data.password),
        nom=user_data.nom,
        prenom=user_data.prenom,
        telephone=encrypted_phone,
        role=user_data.role,
        actif=user_data.actif,
        mot_de_passe_change_le=datetime.utcnow(),
        mot_de_passe_expire_le=datetime.utcnow() + timedelta(days=settings.password_expire_days)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    log_audit(db, current_user.id, AuditAction.USER_CREATED, "User", new_user.id, {"email": user_data.email}, request)
    
    # Send welcome email
    await send_welcome_email(new_user.email, f"{new_user.prenom} {new_user.nom}")
    
    # Return response
    user_response = UserResponse.from_orm(new_user)
    if new_user.telephone:
        user_response.telephone = user_data.telephone  # Return original value
    
    return user_response


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Update user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    if user_data.nom is not None:
        user.nom = user_data.nom
    if user_data.prenom is not None:
        user.prenom = user_data.prenom
    if user_data.telephone is not None:
        user.telephone = encrypt_field(db, user_data.telephone)
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.actif is not None:
        user.actif = user_data.actif
    if user_data.photo_profil is not None:
        user.photo_profil = user_data.photo_profil
    
    db.commit()
    db.refresh(user)
    
    log_audit(db, current_user.id, AuditAction.USER_UPDATED, "User", user.id, request=request)
    
    user_response = UserResponse.from_orm(user)
    if user.telephone:
        user_response.telephone = user_data.telephone if user_data.telephone else decrypt_field(db, user.telephone)
    
    return user_response


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Delete user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    db.delete(user)
    db.commit()
    
    log_audit(db, current_user.id, AuditAction.USER_DELETED, "User", user_id, request=request)
    
    return None

