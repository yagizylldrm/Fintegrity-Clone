from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import hashlib
from web3 import Web3

from app.database import get_db, Contract, AuditLog
from app.api.auth_deps import get_current_user, require_admin

router = APIRouter()

class ContractResponse(BaseModel):
    id: str
    type: str
    value: str
    parties: List[str]
    hash: str
    status: str
    owner_username: Optional[str] = None
    start_date: Optional[str] = None
    completion_date: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        orm_mode = True

class ContractStatusUpdate(BaseModel):
    status: str

class ContractCreate(BaseModel):
    type: str
    value: str
    parties: List[str]
    start_date: Optional[str] = None
    completion_date: Optional[str] = None
    status: Optional[str] = "Pending"

def log_audit(db: Session, username: str, action: str, resource_type: str, resource_id: str, details: str = ""):
    audit = AuditLog(
        username=username,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details
    )
    db.add(audit)

@router.get("/", response_model=List[ContractResponse])
def get_contracts(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role == "admin":
        contracts = db.query(Contract).all()
    else:
        contracts = db.query(Contract).filter(
            Contract.owner_username == current_user.username
        ).all()
        
    # Check expiration date and update status if needed
    now = datetime.now()
    updated = False
    for c in contracts:
        if c.completion_date and c.status not in ["Closed", "Rejected", "Kapalı"]:
            try:
                # completion_date format is "YYYY-MM-DD"
                comp_date = datetime.strptime(c.completion_date.split(" ")[0], "%Y-%m-%d")
                if comp_date.date() <= now.date():
                    c.status = "Kapalı"
                    c.updated_at = datetime.utcnow()
                    updated = True
            except Exception as e:
                print("Error checking completion date:", e)
    if updated:
        db.commit()
    
    res = []
    for c in contracts:
        try:
            parties_list = json.loads(c.parties)
        except Exception:
            parties_list = [c.parties] if c.parties else []
        res.append(ContractResponse(
            id=c.id,
            type=c.type,
            value=c.value,
            parties=parties_list,
            hash=c.hash or "",
            status=c.status or "",
            owner_username=c.owner_username,
            start_date=c.start_date,
            completion_date=c.completion_date,
            created_at=str(c.created_at) if c.created_at else None,
            updated_at=str(c.updated_at) if c.updated_at else None
        ))
    return res

@router.post("/", response_model=ContractResponse)
def create_contract(payload: ContractCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    from app.blockchain_client import create_agreement
    
    # Generate terms hash
    terms_str = f"{payload.type}-{payload.value}-{json.dumps(payload.parties)}"
    terms_hash = "0x" + hashlib.sha256(terms_str.encode()).hexdigest()
    
    # Check if party B address is specified in parties, else default
    party_b = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    if len(payload.parties) > 1:
        potential_address = payload.parties[1]
        if Web3.is_address(potential_address):
            party_b = potential_address
            
    # Create agreement on blockchain
    agreement_id, tx_hash = create_agreement(party_b, terms_hash)
    
    new_id = f"SC-{agreement_id}"
    new_hash = f"{tx_hash}:{agreement_id}"
    
    now = datetime.utcnow()
    new_contract = Contract(
        id=new_id,
        type=payload.type,
        value=payload.value,
        parties=json.dumps(payload.parties),
        hash=new_hash,
        status=payload.status,
        owner_username=current_user.username,
        start_date=payload.start_date,
        completion_date=payload.completion_date,
        created_at=now,
        updated_at=now
    )
    
    db.add(new_contract)
    log_audit(db, current_user.username, "CREATE", "contract", new_id,
              json.dumps({"type": payload.type, "value": payload.value, "blockchain_tx": tx_hash, "agreement_id": agreement_id}))
    db.commit()
    db.refresh(new_contract)
    
    return ContractResponse(
        id=new_contract.id,
        type=new_contract.type,
        value=new_contract.value,
        parties=payload.parties,
        hash=new_contract.hash,
        status=new_contract.status,
        owner_username=new_contract.owner_username,
        start_date=new_contract.start_date,
        completion_date=new_contract.completion_date,
        created_at=str(new_contract.created_at) if new_contract.created_at else None,
        updated_at=str(new_contract.updated_at) if new_contract.updated_at else None
    )

@router.put("/{contract_id}/status")
def update_contract_status(contract_id: str, payload: ContractStatusUpdate, db: Session = Depends(get_db), admin_user = Depends(require_admin)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Sözleşme bulunamadı")
        
    agreement_id = None
    try:
        if contract_id.startswith("SC-"):
            agreement_id = int(contract_id.split("-")[1])
    except Exception:
        pass
        
    if agreement_id is None and contract.hash and ":" in contract.hash:
        try:
            agreement_id = int(contract.hash.split(":")[1])
        except Exception:
            pass

    from app.blockchain_client import approve_agreement, reject_agreement, complete_agreement
    tx_hash = None
    if agreement_id is not None:
        if payload.status == "Approved":
            tx_hash = approve_agreement(agreement_id)
        elif payload.status == "Rejected":
            tx_hash = reject_agreement(agreement_id)
        elif payload.status == "Completed":
            tx_hash = complete_agreement(agreement_id)

    old_status = contract.status
    contract.status = payload.status
    contract.updated_at = datetime.utcnow()
    
    if tx_hash:
        contract.hash = f"{tx_hash}:{agreement_id}"
        
    action = "APPROVE" if payload.status == "Approved" else "REJECT" if payload.status == "Rejected" else "UPDATE"
    log_audit(db, admin_user.username, action, "contract", contract_id,
              json.dumps({"old_status": old_status, "new_status": payload.status, "blockchain_tx": tx_hash}))
              
    db.commit()
    return {"success": True, "message": f"Sözleşme durumu '{payload.status}' olarak güncellendi"}
