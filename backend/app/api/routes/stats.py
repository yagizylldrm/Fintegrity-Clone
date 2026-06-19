from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, Anomaly, Contract, Document, Transaction
from app.api.auth_deps import get_current_user
from datetime import datetime

router = APIRouter()

@router.get("")
def get_stats(db: Session = Depends(get_db)):
    documents_count = db.query(Document).count()
    
    contracts_count = db.query(Contract).count()
    if contracts_count == 0:
        contracts_count = 24  # Fallback if DB is not seeded yet

    anomalies_count = db.query(Anomaly).count()
    
    from app.blockchain_client import calculate_blockchain_tps
    tps = calculate_blockchain_tps()

    return {
        "documents": documents_count,
        "contracts": contracts_count,
        "anomalies": anomalies_count,
        "tps": tps
    }

@router.get("/chain-info")
def get_chain_info():
    """Blockchain ağ bilgilerini döner."""
    from app.blockchain_client import get_chain_info as _get_chain_info
    return _get_chain_info()

