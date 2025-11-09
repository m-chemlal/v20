from sqlalchemy.orm import Session
from models import AuditLog
from typing import Optional
from datetime import datetime
from fastapi import Request


def log_audit(
    db: Session,
    user_id: Optional[int],
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    details: Optional[dict] = None,
    request: Optional[Request] = None
):
    """Log an audit event"""
    ip_address = None
    user_agent = None
    
    if request:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
    
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db.add(audit_log)
    db.commit()
    return audit_log


# Common audit actions
class AuditAction:
    USER_LOGIN = "USER_LOGIN"
    USER_LOGIN_FAILED = "USER_LOGIN_FAILED"
    USER_LOGOUT = "USER_LOGOUT"
    USER_CREATED = "USER_CREATED"
    USER_UPDATED = "USER_UPDATED"
    USER_DELETED = "USER_DELETED"
    PASSWORD_CHANGED = "PASSWORD_CHANGED"
    PASSWORD_RESET = "PASSWORD_RESET"
    PROJECT_CREATED = "PROJECT_CREATED"
    PROJECT_UPDATED = "PROJECT_UPDATED"
    PROJECT_DELETED = "PROJECT_DELETED"
    INDICATOR_CREATED = "INDICATOR_CREATED"
    INDICATOR_UPDATED = "INDICATOR_UPDATED"
    INDICATOR_DELETED = "INDICATOR_DELETED"
    FINANCEMENT_CREATED = "FINANCEMENT_CREATED"
    FINANCEMENT_UPDATED = "FINANCEMENT_UPDATED"
    FINANCEMENT_DELETED = "FINANCEMENT_DELETED"
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"
    DOCUMENT_DELETED = "DOCUMENT_DELETED"
    EXPORT_GENERATED = "EXPORT_GENERATED"

