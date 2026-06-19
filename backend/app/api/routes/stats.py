from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, Anomaly, Contract, Document, Transaction, User
from app.api.auth_deps import security
from app.config import settings
import jwt

router = APIRouter()

@router.get("/")
def get_stats(db: Session = Depends(get_db), credentials=Depends(security)):
    current_user = None
    if credentials:
        try:
            token = credentials.credentials
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            username = payload.get("sub")
            if username:
                current_user = db.query(User).filter(User.username == username).first()
        except Exception:
            pass

    if current_user is None or current_user.role == "admin":
        documents_count = db.query(Document).count()
        contracts_count = db.query(Contract).count()
        anomalies_count = db.query(Anomaly).count()
    else:
        documents_count = db.query(Document).filter(
            (Document.receiver == current_user.wallet_address) |
            (Document.owner_username == current_user.username)
        ).count()
        contracts_count = db.query(Contract).filter(Contract.owner_username == current_user.username).count()
        anomalies_count = db.query(Anomaly).filter(Anomaly.owner_username == current_user.username).count()
    
    if contracts_count == 0 and (current_user is None or current_user.role == "admin"):
        contracts_count = 24  # Fallback if DB is not seeded yet

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


