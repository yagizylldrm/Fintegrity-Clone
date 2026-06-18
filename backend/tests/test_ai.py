def test_anomaly_detection_normal_amount(client):
    payload = {
        "transaction_amount": 15000.0,
        "account_id": "ACC-TEST"
    }
    response = client.post("/api/ai/anomaly-detect", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 15000.0
    assert "anomaly_score" in data
    assert data["is_anomaly"] is False


def test_anomaly_detection_high_amount(client):
    payload = {
        "transaction_amount": 9999999.0,
        "account_id": "ACC-TEST"
    }
    response = client.post("/api/ai/anomaly-detect", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "anomaly_score" in data
    # High amounts should trigger anomaly
    assert data["is_anomaly"] is True or data["anomaly_score"] > 0.5

def test_document_classification(client):
    payload = {
        "document_text": "fatura bedeli 15000 tl kdv dahil"
    }
    response = client.post("/api/ai/classify-doc", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "document_type" in data
    assert "confidence_score" in data
