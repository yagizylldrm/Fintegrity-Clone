from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db, AuditLog
from app.api.auth_deps import get_current_user, require_admin

router = APIRouter()

class AuditLogResponse(BaseModel):
    id: int
    timestamp: Optional[str] = None
    username: Optional[str] = None
    action: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[str] = None

    class Config:
        orm_mode = True

@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    action: Optional[str] = Query(None, description="Filter by action"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Audit log kayıtlarını getirir. Admin tüm logları, user sadece kendi loglarını görür."""
    query = db.query(AuditLog)
    
    if current_user.role != "admin":
        query = query.filter(AuditLog.username == current_user.username)
    
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    if action:
        query = query.filter(AuditLog.action == action)
    
    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    
    result = []
    for log in logs:
        result.append(AuditLogResponse(
            id=log.id,
            timestamp=str(log.timestamp) if log.timestamp else None,
            username=log.username,
            action=log.action,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            details=log.details
        ))
    return result

@router.get("/stats")
def get_audit_stats(db: Session = Depends(get_db), admin_user = Depends(require_admin)):
    """Audit log istatistikleri (sadece admin)."""
    total = db.query(AuditLog).count()
    
    from sqlalchemy import func
    actions = db.query(AuditLog.action, func.count(AuditLog.id)).group_by(AuditLog.action).all()
    resources = db.query(AuditLog.resource_type, func.count(AuditLog.id)).group_by(AuditLog.resource_type).all()
    
    return {
        "total_logs": total,
        "by_action": {a: c for a, c in actions},
        "by_resource": {r: c for r, c in resources}
    }
