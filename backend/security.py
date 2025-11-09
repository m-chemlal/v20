from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy import text
from config import settings
from models import User
import bcrypt

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a bcrypt hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.algorithm)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.refresh_token_secret, algorithm=settings.algorithm)
    return encoded_jwt


def verify_token(token: str, is_refresh: bool = False) -> Optional[dict]:
    """Verify and decode JWT token"""
    try:
        secret = settings.refresh_token_secret if is_refresh else settings.jwt_secret
        payload = jwt.decode(token, secret, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None


def encrypt_field(db: Session, value: str) -> bytes:
    """Encrypt a field using MySQL AES_ENCRYPT"""
    if not value:
        return None
    result = db.execute(
        text("SELECT AES_ENCRYPT(:value, :key)"),
        {"value": value, "key": settings.enc_key}
    ).scalar()
    return result


def decrypt_field(db: Session, encrypted_value: bytes) -> Optional[str]:
    """Decrypt a field using MySQL AES_DECRYPT"""
    if not encrypted_value:
        return None
    try:
        result = db.execute(
            text("SELECT CAST(AES_DECRYPT(:encrypted, :key) AS CHAR)"),
            {"encrypted": encrypted_value, "key": settings.enc_key}
        ).scalar()
        return result.decode('utf-8') if result else None
    except Exception:
        return None


def check_password_strength(password: str) -> tuple[bool, str]:
    """Check password strength according to policy"""
    if len(password) < settings.password_min_length:
        return False, f"Password must be at least {settings.password_min_length} characters"
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password):
        return False, "Password must contain at least one special character"
    return True, "Password is valid"

