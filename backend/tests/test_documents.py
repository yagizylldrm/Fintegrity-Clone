def test_create_and_get_document(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    
    # 1. Create document
    create_payload = {
        "type": "e-Fatura",
        "amount": 25000.0,
        "sender": "Müşteri A.Ş."
    }
    response = client.post("/api/documents/", json=create_payload, headers=headers)
    assert response.status_code == 200
    doc = response.json()
    assert doc["type"] == "e-Fatura"
    assert doc["amount"] == 25000.0
    assert doc["sender"] == "Müşteri A.Ş."
    assert "id" in doc
    assert doc["owner_username"] == "user"
    
    # 2. Get documents list as user (should see own doc)
    list_response = client.get("/api/documents/", headers=headers)
    assert list_response.status_code == 200
    docs = list_response.json()
    assert len(docs) >= 1
    assert any(d["id"] == doc["id"] for d in docs)

def test_document_isolation(client, user_token, admin_token):
    # User token creates a doc
    user_headers = {"Authorization": f"Bearer {user_token}"}
    create_payload = {
        "type": "e-İrsaliye",
        "amount": 1000.0,
        "sender": "User Sender"
    }
    user_doc = client.post("/api/documents/", json=create_payload, headers=user_headers).json()
    
    # Admin token creates a doc
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    create_payload = {
        "type": "e-Fatura",
        "amount": 50000.0,
        "sender": "Admin Sender"
    }
    admin_doc = client.post("/api/documents/", json=create_payload, headers=admin_headers).json()
    
    # User calls list: should see only own doc, not admin's
    user_docs = client.get("/api/documents/", headers=user_headers).json()
    user_doc_ids = [d["id"] for d in user_docs]
    assert user_doc["id"] in user_doc_ids
    assert admin_doc["id"] not in user_doc_ids
    
    # Admin calls list: should see both docs
    admin_docs = client.get("/api/documents/", headers=admin_headers).json()
    admin_doc_ids = [d["id"] for d in admin_docs]
    assert user_doc["id"] in admin_doc_ids
    assert admin_doc["id"] in admin_doc_ids

def test_admin_update_status_and_delete(client, user_token, admin_token):
    user_headers = {"Authorization": f"Bearer {user_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create doc as user
    create_payload = {
        "type": "e-Fatura",
        "amount": 15000.0,
        "sender": "Test Ltd."
    }
    doc = client.post("/api/documents/", json=create_payload, headers=user_headers).json()
    
    # Admin approves
    update_response = client.put(f"/api/documents/{doc['id']}/status", json={"status": "Onaylandı"}, headers=admin_headers)
    assert update_response.status_code == 200
    
    # Admin deletes
    delete_response = client.delete(f"/api/documents/{doc['id']}", headers=admin_headers)
    assert delete_response.status_code == 200
