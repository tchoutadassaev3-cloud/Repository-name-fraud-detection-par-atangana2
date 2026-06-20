from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

# =========================================================
# DATABASE CONFIGURATION
# =========================================================

# SQLite for Proof of Concept
# Later upgrade:
# PostgreSQL / MySQL

DATABASE_URL = "sqlite:///./fraud_system.db"

# =========================================================
# ENGINE
# =========================================================

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False
    },
    echo=False
)

# =========================================================
# SESSION
# =========================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# =========================================================
# INITIALIZE DATABASE
# =========================================================

def init_db():

    Base.metadata.create_all(bind=engine)

    print(f"[+] Database initialized: {DATABASE_URL}")

# =========================================================
# DATABASE SESSION DEPENDENCY
# =========================================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()

