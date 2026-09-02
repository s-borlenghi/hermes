import os

os.environ.setdefault("RATE_LIMIT_AUTH", "1000/minute")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app


@pytest.fixture()
def db_session(tmp_path):
    db_path = tmp_path / "test.db"
    engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(client):
    def _register_and_login(email: str = "candidate@example.com", password: str = "supersecret1"):
        client.post("/auth/register", json={"email": email, "password": password, "full_name": "Test Candidate"})
        response = client.post("/auth/login", data={"username": email, "password": password})
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _register_and_login
