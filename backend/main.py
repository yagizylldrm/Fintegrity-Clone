from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import transactions, ai, auth, anomalies, contracts, stats, documents, audit
from app.database import engine, Base, SessionLocal, User, Contract, Document, Transaction
import json
from passlib.context import CryptContext


app = FastAPI(title="Fintegrity API", version="1.0.0", description="Backend for Fintegrity Platform")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(anomalies.router, prefix="/api/anomalies", tags=["Anomalies"])
app.include_router(contracts.router, prefix="/api/contracts", tags=["Contracts"])
app.include_router(stats.router, prefix="/api/stats", tags=["Stats"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit"])


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def run_migrations():
    """Add new columns to existing tables if they don't exist (simple migration)."""
    import sqlite3
    conn = sqlite3.connect('./fintegrity.db')
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
        except sqlite3.OperationalError:
            pass  # Column already exists
    
    conn.commit()
    conn.close()

@app.on_event("startup")
def startup_event():
    # Create DB tables
    Base.metadata.create_all(bind=engine)
    run_migrations()

    
    # Seed default users
    db = SessionLocal()
    try:
        # Check if admin exists
        if not db.query(User).filter(User.username == "admin").first():
            admin_user = User(
                username="admin", 
                password_hash=pwd_context.hash("admin123"), 
                role="admin"
            )
            db.add(admin_user)
        
        # Check if standard user exists
        if not db.query(User).filter(User.username == "user").first():
            standard_user = User(
                username="user", 
                password_hash=pwd_context.hash("user123"), 
                role="user"
            )
            db.add(standard_user)
            
        db.commit()

        if not db.query(Contract).first():
            mock_contracts = [
                {"id": "SC-0x9A4b", "type": "Tedarik Zinciri", "value": "125,000 ₺", "parties": ["Lojistik A.Ş.", "Üretici Ltd."], "hash": "0x9a4b8c...", "status": "Active"},
                {"id": "SC-0x3F21", "type": "Personel Maaş", "value": "240,000 ₺", "parties": ["Fintegrity HR", "Çalışanlar (x42)"], "hash": "0x3f21e9...", "status": "Pending"},
                {"id": "SC-0x7C88", "type": "Uluslararası B2B", "value": "$45,000", "parties": ["Global Export", "Local Import Co."], "hash": "0x7c88a1...", "status": "Active"},
                {"id": "SC-0x1D45", "type": "Araç Filo Sigortası", "value": "85,000 ₺", "parties": ["Sigorta A.Ş.", "Kiralama Ltd."], "hash": "0x1d45f2...", "status": "Pending"},
                {"id": "SC-0x5E92", "type": "Emlak Kira", "value": "12,500 ₺", "parties": ["Mülk Sahibi", "Kiracı A.Ş."], "hash": "0x5e92b3...", "status": "Active"}
            ]
            for c in mock_contracts:
                new_contract = Contract(
                    id=c["id"],
                    type=c["type"],
                    value=c["value"],
                    parties=json.dumps(c["parties"]),
                    hash=c["hash"],
                    status=c["status"]
                )
                db.add(new_contract)
            db.commit()

        if not db.query(Document).first():
            mock_docs = [
                { "id": 'DOC-001', "type": 'e-Fatura', "amount": 15400.0, "date": '2026-06-17 10:45', "status": 'Onaylandı', "sender": 'Tech Corp A.Ş.', "hash": '0xabc12334f' },
                { "id": 'DOC-002', "type": 'e-İrsaliye', "amount": 0.0, "date": '2026-06-17 11:20', "status": 'Beklemede', "sender": 'Lojistik Ltd.', "hash": '0x89211ab34' },
                { "id": 'DOC-003', "type": 'e-Sözleşme', "amount": 50000.0, "date": '2026-06-16 09:10', "status": 'İmzalandı', "sender": 'Danışmanlık A.Ş.', "hash": '0xfed399b22' },
                { "id": 'DOC-004', "type": 'e-Fatura', "amount": 8250.0, "date": '2026-06-15 16:55', "status": 'Onaylandı', "sender": 'Yazılım Evi', "hash": '0x123456bbd' },
                { "id": 'DOC-005', "type": 'e-Makbuz', "amount": 1200.0, "date": '2026-06-14 14:20', "status": 'Reddedildi', "sender": 'Bireysel Müşteri', "hash": '0xdef789a11' },
                { "id": 'DOC-006', "type": 'e-Fatura', "amount": 125000.0, "date": '2026-06-13 09:00', "status": 'Beklemede', "sender": 'Mega İnşaat', "hash": '0xaaabbb993' },
                { "id": 'DOC-007', "type": 'e-İrsaliye', "amount": 0.0, "date": '2026-06-12 11:00', "status": 'Onaylandı', "sender": 'Oto Parça Sanayi', "hash": '0xcccddd221' }
            ]
            for d in mock_docs:
                new_doc = Document(
                    id=d["id"],
                    type=d["type"],
                    amount=d["amount"],
                    date=d["date"],
                    status=d["status"],
                    sender=d["sender"],
                    hash=d["hash"]
                )
                db.add(new_doc)
            db.commit()

        if not db.query(Transaction).first():
            mock_txs = [
                { "id": "TX-001", "hash": "0xabc12334f", "type": "e-Fatura", "status": "verified", "amount": 15400.0, "time": "2026-06-17 10:45", "sender": "Tech Corp A.Ş." },
                { "id": "TX-002", "hash": "0x89211ab34", "type": "e-İrsaliye", "status": "pending", "amount": 0.0, "time": "2026-06-17 11:20", "sender": "Lojistik Ltd." },
                { "id": "TX-003", "hash": "0xfed399b22", "type": "e-Sözleşme", "status": "verified", "amount": 50000.0, "time": "2026-06-16 09:10", "sender": "Danışmanlık A.Ş." },
                { "id": "TX-004", "hash": "0x123456bbd", "type": "e-Fatura", "status": "verified", "amount": 8250.0, "time": "2026-06-15 16:55", "sender": "Yazılım Evi" }
            ]
            for t in mock_txs:
                new_tx = Transaction(
                    id=t["id"],
                    hash=t["hash"],
                    type=t["type"],
                    status=t["status"],
                    amount=t["amount"],
                    time=t["time"],
                    sender=t["sender"]
                )
                db.add(new_tx)
            db.commit()
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to Fintegrity Platform API"}
