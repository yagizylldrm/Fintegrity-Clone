from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import json

from app.database import get_db, Anomaly, AuditLog
from app.api.auth_deps import get_current_user, require_admin

router = APIRouter()

class AnomalyCreate(BaseModel):
    account: str
    amount: int
    score: float
    risk: str
    txHash: str

class AnomalyResponse(BaseModel):
    id: str
    account: str
    amount: int
    score: float
    risk: str
    status: str
    date: str
    txHash: str
    owner_username: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        orm_mode = True

class AnomalyResolve(BaseModel):
    status: str # 'Güvenli' or 'Donduruldu'

def log_audit(db: Session, username: str, action: str, resource_type: str, resource_id: str, details: str = ""):
    audit = AuditLog(
        username=username,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details
    )
    db.add(audit)

@router.get("/", response_model=List[AnomalyResponse])
def get_anomalies(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role == "admin":
        anoms = db.query(Anomaly).all()
    else:
        anoms = db.query(Anomaly).filter(
            Anomaly.owner_username == current_user.username
        ).all()
        
    result = []
    for a in anoms:
        result.append(AnomalyResponse(
            id=a.id,
            account=a.account or "",
            amount=a.amount or 0,
            score=a.score or 0.0,
            risk=a.risk or "",
            status=a.status or "Beklemede",
            date=a.date or "",
            txHash=a.txHash or "",
            owner_username=a.owner_username,
            created_at=str(a.created_at) if a.created_at else None
        ))
    return result

@router.post("/", response_model=AnomalyResponse)
def create_anomaly(anomaly: AnomalyCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    anomaly_id = f"AI-{str(uuid.uuid4())[:8].upper()}"
    now = datetime.utcnow()
    new_anomaly = Anomaly(
        id=anomaly_id,
        account=anomaly.account,
        amount=anomaly.amount,
        score=anomaly.score,
        risk=anomaly.risk,
        status="Beklemede",
        date=datetime.now().strftime("%d %b, %H:%M"),
        txHash=anomaly.txHash,
        owner_username=current_user.username,
        created_at=now
    )
    db.add(new_anomaly)
    log_audit(db, current_user.username, "CREATE", "anomaly", anomaly_id,
              json.dumps({"account": anomaly.account, "amount": anomaly.amount, "risk": anomaly.risk}))
    db.commit()
    db.refresh(new_anomaly)
    return AnomalyResponse(
        id=new_anomaly.id,
        account=new_anomaly.account or "",
        amount=new_anomaly.amount or 0,
        score=new_anomaly.score or 0.0,
        risk=new_anomaly.risk or "",
        status=new_anomaly.status or "Beklemede",
        date=new_anomaly.date or "",
        txHash=new_anomaly.txHash or "",
        owner_username=new_anomaly.owner_username,
        created_at=str(new_anomaly.created_at) if new_anomaly.created_at else None
    )

@router.put("/{anomaly_id}/resolve")
def resolve_anomaly(anomaly_id: str, payload: AnomalyResolve, db: Session = Depends(get_db), admin_user = Depends(require_admin)):
    anomaly = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomali bulunamadı")
        
    old_status = anomaly.status
    anomaly.status = payload.status
    
    log_audit(db, admin_user.username, "UPDATE", "anomaly", anomaly_id,
              json.dumps({"old_status": old_status, "new_status": payload.status}))
              
    db.commit()
    return {"success": True, "message": f"Anomali durumu '{payload.status}' olarak güncellendi"}

