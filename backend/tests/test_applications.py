def _create_company(client, headers, name="Acme Corp"):
    response = client.post("/companies", json={"name": name}, headers=headers)
    assert response.status_code == 201
    return response.json()["id"]


def test_create_and_list_application(client, auth_headers):
    headers = auth_headers()
    company_id = _create_company(client, headers)

    response = client.post(
        "/applications",
        json={"role_title": "Backend Engineer", "company_id": company_id, "status": "applied"},
        headers=headers,
    )
    assert response.status_code == 201
    application_id = response.json()["id"]

    listing = client.get("/applications", headers=headers)
    assert listing.status_code == 200
    body = listing.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == application_id
    assert body["items"][0]["company"]["name"] == "Acme Corp"


def test_application_requires_owned_company(client, auth_headers):
    headers = auth_headers()
    response = client.post(
        "/applications",
        json={"role_title": "Engineer", "company_id": 9999},
        headers=headers,
    )
    assert response.status_code == 400


def test_applications_are_isolated_per_user(client, auth_headers):
    headers_a = auth_headers("owner-a@example.com", "supersecret1")
    company_id = _create_company(client, headers_a, "OnlyA Inc")
    client.post(
        "/applications",
        json={"role_title": "Engineer", "company_id": company_id},
        headers=headers_a,
    )

    headers_b = auth_headers("owner-b@example.com", "supersecret1")
    listing_b = client.get("/applications", headers=headers_b)
    assert listing_b.json()["total"] == 0

    listing_a = client.get("/applications", headers=headers_a)
    assert listing_a.json()["total"] == 1


def test_update_and_delete_application(client, auth_headers):
    headers = auth_headers()
    company_id = _create_company(client, headers)
    created = client.post(
        "/applications",
        json={"role_title": "Engineer", "company_id": company_id, "status": "wishlist"},
        headers=headers,
    ).json()

    updated = client.patch(
        f"/applications/{created['id']}",
        json={"status": "applied"},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "applied"

    deleted = client.delete(f"/applications/{created['id']}", headers=headers)
    assert deleted.status_code == 204
    assert client.get(f"/applications/{created['id']}", headers=headers).status_code == 404


def test_filter_applications_by_status(client, auth_headers):
    headers = auth_headers()
    company_id = _create_company(client, headers)
    client.post(
        "/applications", json={"role_title": "A", "company_id": company_id, "status": "applied"}, headers=headers
    )
    client.post(
        "/applications", json={"role_title": "B", "company_id": company_id, "status": "wishlist"}, headers=headers
    )

    response = client.get("/applications", params={"status": "applied"}, headers=headers)
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["role_title"] == "A"


def test_add_interview_stage(client, auth_headers):
    headers = auth_headers()
    company_id = _create_company(client, headers)
    application_id = client.post(
        "/applications", json={"role_title": "Engineer", "company_id": company_id}, headers=headers
    ).json()["id"]

    stage = client.post(
        f"/applications/{application_id}/stages",
        json={"stage_name": "Phone screen", "completed": True},
        headers=headers,
    )
    assert stage.status_code == 201

    application = client.get(f"/applications/{application_id}", headers=headers).json()
    assert len(application["stages"]) == 1
    assert application["stages"][0]["stage_name"] == "Phone screen"
