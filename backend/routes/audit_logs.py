from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import AuditLog
from schemas import AuditLogResponse
from dependencies import get_current_user, require_role
from models import User

router = APIRouter(prefix="/audit-logs", tags=["audit"])


@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: int = None,
    action: str = None,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get audit logs (admin only)"""
    query = db.query(AuditLog)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs

