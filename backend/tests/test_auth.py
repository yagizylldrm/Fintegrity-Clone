def test_login_success(client):
    response = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    json_data = response.json()
    assert "access_token" in json_data
    assert json_data["success"] is True

def test_login_failure(client):
    response = client.post("/api/auth/login", json={"username": "admin", "password": "wrongpassword"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Kullanıcı adı veya şifre hatalı"

def test_protected_route_without_token(client):
    response = client.get("/api/documents")
    assert response.status_code == 401

def test_admin_only_route_as_user(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    response = client.delete("/api/documents/DOC-ANY", headers=headers)
    assert response.status_code == 403
