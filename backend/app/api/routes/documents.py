from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db, Document, AuditLog
from app.api.auth_deps import get_current_user, require_admin
from datetime import datetime
import uuid
import json

router = APIRouter()

class DocumentResponse(BaseModel):
    id: str
    type: str
    amount: float
    date: str
    status: str
    sender: str
    hash: str
    receiver: Optional[str] = ""
    owner_username: Optional[str] = None
    blockchain_tx_hash: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        orm_mode = True

class DocumentCreate(BaseModel):
    type: str
    amount: float
    sender: str
    receiver: Optional[str] = ""
    status: Optional[str] = "Beklemede"

class DocumentStatusUpdate(BaseModel):
    status: str

def log_audit(db: Session, username: str, action: str, resource_type: str, resource_id: str, details: str = ""):
    audit = AuditLog(
        username=username,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details
    )
    db.add(audit)

@router.get("/", response_model=List[DocumentResponse])
def get_documents(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role == "admin":
        docs = db.query(Document).order_by(Document.date.desc()).all()
    else:
        docs = db.query(Document).filter(
            (Document.receiver == current_user.wallet_address) |
            (Document.owner_username == current_user.username)
        ).order_by(Document.date.desc()).all()
    
    result = []
    for doc in docs:
        result.append(DocumentResponse(
            id=doc.id,
            type=doc.type,
            amount=doc.amount,
            date=doc.date or "",
            status=doc.status or "",
            sender=doc.sender or "",
            receiver=doc.receiver or "",
            hash=doc.hash or "",
            owner_username=doc.owner_username,
            blockchain_tx_hash=doc.blockchain_tx_hash,
            created_at=str(doc.created_at) if doc.created_at else None,
            updated_at=str(doc.updated_at) if doc.updated_at else None
        ))
    return result

@router.post("/", response_model=DocumentResponse)
def create_document(doc: DocumentCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    from app.blockchain_client import add_document_log
    
    doc_id = f"DOC-{str(uuid.uuid4())[:8].upper()}"
    import hashlib
    doc_hash = "0x" + hashlib.sha256(f"{doc_id}-{doc.type}-{doc.amount}".encode()).hexdigest()
    
    # Write to blockchain
    blockchain_tx = add_document_log(doc_id, doc_hash, doc.type)
    
    now = datetime.utcnow()
    new_doc = Document(
        id=doc_id,
        type=doc.type,
        amount=doc.amount,
        date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status=doc.status,
        sender=doc.sender,
        receiver=doc.receiver,
        hash=doc_hash,
        owner_username=current_user.username,
        blockchain_tx_hash=blockchain_tx,
        created_at=now,
        updated_at=now
    )
    db.add(new_doc)
    
    log_audit(db, current_user.username, "CREATE", "document", doc_id,
              json.dumps({"type": doc.type, "amount": doc.amount, "sender": doc.sender, "receiver": doc.receiver or "", "blockchain_tx": blockchain_tx}))
    
    db.commit()
    db.refresh(new_doc)
    return DocumentResponse(
        id=new_doc.id, type=new_doc.type, amount=new_doc.amount,
        date=new_doc.date or "", status=new_doc.status or "",
        sender=new_doc.sender or "", receiver=new_doc.receiver or "", hash=new_doc.hash or "",
        owner_username=new_doc.owner_username,
        blockchain_tx_hash=new_doc.blockchain_tx_hash,
        created_at=str(new_doc.created_at) if new_doc.created_at else None,
        updated_at=str(new_doc.updated_at) if new_doc.updated_at else None
    )

@router.put("/{doc_id}/status")
def update_document_status(doc_id: str, payload: DocumentStatusUpdate, db: Session = Depends(get_db), admin_user = Depends(require_admin)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    
    old_status = doc.status
    doc.status = payload.status
    doc.updated_at = datetime.utcnow()
    
    action = "APPROVE" if payload.status == "Onaylandı" else "REJECT" if payload.status == "Reddedildi" else "UPDATE"
    log_audit(db, admin_user.username, action, "document", doc_id,
              json.dumps({"old_status": old_status, "new_status": payload.status}))
    
    db.commit()
    return {"success": True, "message": f"Belge durumu '{payload.status}' olarak güncellendi"}

@router.delete("/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db), admin_user = Depends(require_admin)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    
    log_audit(db, admin_user.username, "DELETE", "document", doc_id,
              json.dumps({"type": doc.type, "amount": doc.amount, "sender": doc.sender}))
    
    db.delete(doc)
    db.commit()
    return {"success": True, "message": "Belge başarıyla silindi"}

@router.get("/{doc_id}/verify-chain")
def verify_document_chain(doc_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Belgenin blockchain'deki kaydını doğrular."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    
    from app.blockchain_client import verify_document_on_chain
    result = verify_document_on_chain(doc_id, doc.hash)
    
    log_audit(db, current_user.username, "VERIFY", "document", doc_id,
              json.dumps({"verified": result["verified"], "status": result["status"]}))
    db.commit()
    
    return result

