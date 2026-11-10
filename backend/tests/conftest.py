import os

# Must run before anything imports database.py, and must overwrite any real
# DB_URL (load_dotenv never replaces a variable that is already set). This is
# what keeps the tests away from a developer's actual database.
os.environ["DB_URL"] = "sqlite://"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app as app_module
from database import get_db
from models import Base


@pytest.fixture
def session_factory():
    # StaticPool keeps one connection, because each new connection to an
    # in-memory SQLite database would otherwise get its own empty database.
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    yield sessionmaker(bind=engine, autoflush=False)
    engine.dispose()


@pytest.fixture
def db(session_factory):
    session = session_factory()
    yield session
    session.close()


@pytest.fixture
def client(session_factory):
    def override_get_db():
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app_module._app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app_module._app)
    app_module._app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def broadcasts(monkeypatch):
    """Record what would be sent over Socket.IO as (room, event, data)."""
    sent = []

    async def record(group_code, event, data):
        sent.append((group_code, event, data))

    monkeypatch.setattr(app_module, "broadcast", record)
    return sent
