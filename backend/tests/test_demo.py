from app.config import get_settings

settings = get_settings()


def test_demo_endpoints_unseeded_return_503(client):
    response = client.get("/demo/applications")
    assert response.status_code == 503


def test_demo_endpoints_are_public_once_seeded(client, auth_headers):
    headers = auth_headers(settings.demo_user_email, "demo-password-not-real")
    company_id = client.post("/companies", json={"name": "Demo Co"}, headers=headers).json()["id"]
    client.post(
        "/applications",
        json={"role_title": "Demo Role", "company_id": company_id, "status": "interview"},
        headers=headers,
    )

    response = client.get("/demo/applications")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["role_title"] == "Demo Role"

    stats = client.get("/demo/stats/summary")
    assert stats.status_code == 200
    assert stats.json()["total_applications"] == 1
