def test_register_and_login(client):
    response = client.post(
        "/auth/register",
        json={"email": "a@example.com", "password": "supersecret1", "full_name": "A"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "a@example.com"
    assert "hashed_password" not in body

    login = client.post("/auth/login", data={"username": "a@example.com", "password": "supersecret1"})
    assert login.status_code == 200
    assert login.json()["token_type"] == "bearer"


def test_register_duplicate_email_rejected(client):
    payload = {"email": "dup@example.com", "password": "supersecret1"}
    first = client.post("/auth/register", json=payload)
    second = client.post("/auth/register", json=payload)
    assert first.status_code == 201
    assert second.status_code == 409


def test_login_wrong_password_rejected(client):
    client.post("/auth/register", json={"email": "b@example.com", "password": "supersecret1"})
    response = client.post("/auth/login", data={"username": "b@example.com", "password": "wrongpass"})
    assert response.status_code == 401


def test_me_requires_token(client):
    assert client.get("/auth/me").status_code == 401


def test_me_returns_current_user(client, auth_headers):
    headers = auth_headers("c@example.com", "supersecret1")
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "c@example.com"
