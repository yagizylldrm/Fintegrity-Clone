from fastapi import APIRouter
from pydantic import BaseModel
from app.ai_module.anomaly import anomaly_detector
from app.ai_module.classifier import document_classifier

router = APIRouter()

class AnomalyReq(BaseModel):
    transaction_amount: float
    account_id: str

class DocClassifyReq(BaseModel):
    document_text: str

@router.post("/anomaly-detect")
def detect_anomaly(req: AnomalyReq):
    result = anomaly_detector.detect_anomaly(req.transaction_amount)
    return {
        "account_id": req.account_id,
        "amount": req.transaction_amount,
        "anomaly_score": result["score"],
        "is_anomaly": result["is_anomaly"],
        "reason": result["reason"],
        "suggested_action": result["suggested_action"],
        "threshold": result["threshold"],
        "model": result["model"]
    }

@router.post("/classify-doc")
def classify_document(req: DocClassifyReq):
    result = document_classifier.classify(req.document_text)
    return result


