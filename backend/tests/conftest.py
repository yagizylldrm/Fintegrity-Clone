import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import sys
import os

# Add backend dir to path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.database import Base, get_db
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Use memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Run manual migrations for test database
    import sqlite3
    conn = engine.raw_connection()
    cursor = conn.cursor()
    migrations = [
        ("documents", "owner_username", "TEXT DEFAULT 'admin'"),
        ("documents", "blockchain_tx_hash", "TEXT DEFAULT ''"),
        ("documents", "created_at", "TIMESTAMP"),
        ("documents", "updated_at", "TIMESTAMP"),
        ("contracts", "owner_username", "TEXT DEFAULT 'admin'"),
        ("contracts", "created_at", "TIMESTAMP"),
        ("contracts", "updated_at", "TIMESTAMP"),
        ("anomalies", "owner_username", "TEXT DEFAULT 'admin'"),
        ("anomalies", "created_at", "TIMESTAMP"),
    ]
    for table, column, col_type in migrations:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
        except Exception:
            pass  # Already exists or memory db issue
    conn.commit()
    conn.close()

    db_session = TestingSessionLocal()
    
    # Seed default users
    from app.database import User
    admin_user = User(username="admin", password_hash=pwd_context.hash("admin123"), role="admin")
    standard_user = User(username="user", password_hash=pwd_context.hash("user123"), role="user")
    db_session.add(admin_user)
    db_session.add(standard_user)
    db_session.commit()
    
    try:
        yield db_session
    finally:
        db_session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def admin_token(client):
    response = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    return response.json()["access_token"]

@pytest.fixture
def user_token(client):
    response = client.post("/api/auth/login", json={"username": "user", "password": "user123"})
    assert response.status_code == 200
    return response.json()["access_token"]

