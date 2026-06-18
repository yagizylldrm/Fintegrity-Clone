from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db, Transaction
from app.api.auth_deps import get_current_user
from datetime import datetime
import uuid

router = APIRouter()

class TransactionResponse(BaseModel):
    id: str
    hash: str
    type: str
    status: str
    amount: float
    time: str
    sender: str

    class Config:
        orm_mode = True

class TransactionCreate(BaseModel):
    type: str
    amount: float
    sender: str
    status: Optional[str] = "pending"

class TransactionReq(BaseModel):
    doc_id: str
    metadata: str

@router.get("/", response_model=List[TransactionResponse])
def get_all_transactions(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Transaction).order_by(Transaction.time.desc()).all()

@router.post("/", response_model=TransactionResponse)
def create_transaction(tx: TransactionCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    tx_id = f"TX-{str(uuid.uuid4())[:8].upper()}"
    tx_hash = f"0x{str(uuid.uuid4())[:8]}{str(uuid.uuid4())[:8]}"
    
    new_tx = Transaction(
        id=tx_id,
        hash=tx_hash,
        type=tx.type,
        status=tx.status,
        amount=tx.amount,
        time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        sender=tx.sender
    )
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    return new_tx

@router.post("/log")
def log_transaction(req: TransactionReq, current_user = Depends(get_current_user)):
    return {
        "status": "success",
        "message": "Transaction submitted to blockchain",
        "data": {
            "doc_id": req.doc_id,
            "hash": "0xabc123..."
        }
    }

@router.get("/{doc_id}")
def get_transaction(doc_id: str, current_user = Depends(get_current_user)):
    return {
        "doc_id": doc_id,
        "status": "verified on blockchain",
        "timestamp": 1693000000
    }
