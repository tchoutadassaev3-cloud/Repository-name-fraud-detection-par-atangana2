from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from .models import Base

# Using SQLite for PoC, but architecture supports PostgreSQL/MySQL
DATABASE_URL = "sqlite:///./fraud_system.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    # Force creation of tables
    Base.metadata.create_all(bind=engine)
    print("[+] Database Initialized at", DATABASE_URL)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
