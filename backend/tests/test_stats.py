def _create_application(client, headers, company_id, status):
    return client.post(
        "/applications",
        json={"role_title": "Engineer", "company_id": company_id, "status": status},
        headers=headers,
    ).json()


def test_stats_summary_rates(client, auth_headers):
    headers = auth_headers()
    company_id = client.post("/companies", json={"name": "Acme"}, headers=headers).json()["id"]

    _create_application(client, headers, company_id, "wishlist")
    _create_application(client, headers, company_id, "applied")
    _create_application(client, headers, company_id, "interview")
    _create_application(client, headers, company_id, "offer")

    response = client.get("/stats/summary", headers=headers)
    assert response.status_code == 200
    body = response.json()

    assert body["total_applications"] == 4
    # 3 submitted (excludes wishlist); interview + offer counted as responses
    assert body["response_rate"] == round(2 / 3, 4)
    assert body["interview_rate"] == round(2 / 3, 4)
    assert body["offer_rate"] == round(1 / 3, 4)


def test_stats_summary_empty(client, auth_headers):
    headers = auth_headers()
    response = client.get("/stats/summary", headers=headers)
    body = response.json()
    assert body["total_applications"] == 0
    assert body["response_rate"] == 0.0


def test_stats_requires_auth(client):
    assert client.get("/stats/summary").status_code == 401


def test_stats_timeline_length(client, auth_headers):
    headers = auth_headers()
    response = client.get("/stats/timeline", params={"months": 3}, headers=headers)
    assert response.status_code == 200
    assert len(response.json()["points"]) == 3
