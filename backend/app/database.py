from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./fintegrity.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String) # 'admin' or 'user'
    theme = Column(String, default='current') # 'current', 'light', 'dark'
    wallet_address = Column(String, index=True, nullable=True)

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String, primary_key=True, index=True)
    account = Column(String)
    amount = Column(Integer)
    score = Column(Float)
    risk = Column(String)
    status = Column(String)
    date = Column(String)
    txHash = Column(String)
    owner_username = Column(String, default='admin')
    created_at = Column(DateTime, default=datetime.utcnow)

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(String, primary_key=True, index=True)
    type = Column(String)
    value = Column(String)
    parties = Column(String) # JSON string representation
    hash = Column(String)
    status = Column(String) # 'Pending', 'Active', 'Approved', 'Rejected'
    owner_username = Column(String, default='admin')
    start_date = Column(String, nullable=True)
    completion_date = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    type = Column(String)
    amount = Column(Float)
    date = Column(String)
    status = Column(String)
    sender = Column(String)
    hash = Column(String)
    owner_username = Column(String, default='admin')
    blockchain_tx_hash = Column(String, default='')
    receiver = Column(String, default='', nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    hash = Column(String)
    type = Column(String)
    status = Column(String)
    amount = Column(Float)
    time = Column(String)
    sender = Column(String)
    receiver = Column(String, default='', nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    username = Column(String)  # Action operator
    action = Column(String)    # 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'VERIFY'
    resource_type = Column(String)  # 'document', 'contract', 'anomaly', 'user'
    resource_id = Column(String)  # Resource identifier
    details = Column(Text, default='')  # Details or JSON string

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


