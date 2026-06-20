from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    UploadFile,
    File,
    Query
)

from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session

from sqlalchemy import func

from typing import Optional

import json
import os
import shutil
import datetime

from .database import (
    get_db,
    init_db
)

from .models import (
    Usager,
    Carte,
    Transaction,
    ModeleAnalyse,
    ResultatAnalyse,
    Alerte,
    SuperviseurSysteme
)

from .analysis_service import FraudInferenceService

# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(

    title="AI Fraud Detection Platform",

    description=(
        "Enterprise-grade fraud detection "
        "and transaction monitoring platform"
    ),

    version="2.0.0"
)

# =========================================================
# CORS
# =========================================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)

# =========================================================
# WEBSOCKET MANAGER
# =========================================================

class ConnectionManager:

    def __init__(self):

        self.active_connections = []

    async def connect(self, websocket: WebSocket):

        await websocket.accept()

        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):

        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):

        for connection in self.active_connections:

            await connection.send_text(message)

manager = ConnectionManager()

# =========================================================
# STARTUP EVENT
# =========================================================

@app.on_event("startup")
def startup():

    init_db()

    db = next(get_db())

    admin = db.query(
        SuperviseurSysteme
    ).filter_by(
        identifiant="admin"
    ).first()

    if not admin:

        admin = SuperviseurSysteme(

            identifiant="admin",

            motDePasse="admin",

            role="admin",

            nom="System",

            prenom="Administrator"
        )

        db.add(admin)

        db.commit()

    print("[+] Application started successfully")

# =========================================================
# AUTHENTICATION
# =========================================================

@app.post("/auth/login", tags=["Authentication"])
def login(data: dict, db: Session = Depends(get_db)):

    user = db.query(
        SuperviseurSysteme
    ).filter(
        SuperviseurSysteme.identifiant == data["username"]
    ).first()

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    if user.motDePasse != data["password"]:

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    return {

        "id": user.idSuperviseur,

        "username": user.identifiant,

        "role": user.role,

        "nom": user.nom,

        "prenom": user.prenom,

        "status": "authenticated"
    }

# =========================================================
# PREDICT TRANSACTION
# =========================================================

@app.post("/predict", tags=["Prediction"])
async def predict_transaction(
    data: dict,
    db: Session = Depends(get_db)
):

    transaction = Transaction(

        montant=data["amt"],

        category=data["category"],

        city_pop=data["city_pop"],

        customer_job=data["job"],

        customer_gender=data.get("gender"),

        unix_time=data["unix_time"],

        customer_lat=data["customer_lat"],

        customer_long=data["customer_long"],

        merch_lat=data["merch_lat"],

        merch_long=data["merch_long"],

        pays_id=data.get("country_code", "FR"),

        ipSource=data.get("ip", "127.0.0.1"),

        referenceCommande=(
            f"TX_"
            f"{os.urandom(4).hex().upper()}"
        ),

        dateHeure=datetime.datetime.utcnow(),

        status="Processing"
    )

    db.add(transaction)

    db.flush()

    # -----------------------------------------------------
    # ML ANALYSIS
    # -----------------------------------------------------

    service = FraudInferenceService(db)

    result = service.analyze(transaction)

    db.commit()

    db.refresh(transaction)

    # -----------------------------------------------------
    # LIVE WEBSOCKET PUSH
    # -----------------------------------------------------

    if transaction.risk_level in ["Critique", "Elevé"]:

        await manager.broadcast(json.dumps({

            "type": "fraud_alert",

            "transaction_id": transaction.idTransaction,

            "amount": transaction.montant,

            "fraud_probability": (
                transaction.fraud_probability
            ),

            "risk_level": transaction.risk_level,

            "status": transaction.status
        }))

    return {

        "transaction_id": transaction.idTransaction,

        "fraud_probability": (
            transaction.fraud_probability
        ),

        "risk_level": transaction.risk_level,

        "prediction": (
            transaction.is_fraud_prediction
        ),

        "status": transaction.status
    }

# =========================================================
# TRANSACTIONS
# =========================================================

@app.get("/transactions", tags=["Transactions"])
def get_transactions(

    limit: int = Query(50),

    db: Session = Depends(get_db)
):

    transactions = db.query(
        Transaction
    ).order_by(
        Transaction.dateHeure.desc()
    ).limit(limit).all()

    results = []

    for tx in transactions:

        results.append({

            "id": tx.idTransaction,

            "amount": tx.montant,

            "category": tx.category,

            "risk_level": tx.risk_level,

            "fraud_probability": (
                tx.fraud_probability
            ),

            "status": tx.status,

            "date": tx.dateHeure
        })

    return results

# =========================================================
# ALERTS
# =========================================================

@app.get("/alerts", tags=["Alerts"])
def get_alerts(db: Session = Depends(get_db)):

    alerts = db.query(
        Alerte
    ).order_by(
        Alerte.created_at.desc()
    ).all()

    return alerts

# =========================================================
# DASHBOARD ANALYTICS
# =========================================================

@app.get(
    "/analytics/dashboard",
    tags=["Analytics"]
)

def dashboard_analytics(
    db: Session = Depends(get_db)
):

    total_transactions = db.query(
        Transaction
    ).count()

    fraud_transactions = db.query(
        Transaction
    ).filter(
        Transaction.is_fraud_prediction == True
    ).count()

    high_risk = db.query(
        Transaction
    ).filter(
        Transaction.risk_level == "Critique"
    ).count()

    total_amount = db.query(
        func.sum(Transaction.montant)
    ).scalar() or 0

    fraud_rate = 0

    if total_transactions > 0:

        fraud_rate = (
            fraud_transactions
            / total_transactions
        ) * 100

    return {

        "total_transactions": total_transactions,

        "fraud_transactions": fraud_transactions,

        "fraud_rate": round(
            fraud_rate,
            2
        ),

        "high_risk_alerts": high_risk,

        "total_amount": total_amount
    }

# =========================================================
# FRAUD TRENDS
# =========================================================

@app.get(
    "/analytics/fraud-trends",
    tags=["Analytics"]
)

def fraud_trends(
    db: Session = Depends(get_db)
):

    transactions = db.query(
        Transaction
    ).all()

    grouped = {}

    for tx in transactions:

        day = tx.dateHeure.strftime("%Y-%m-%d")

        if day not in grouped:

            grouped[day] = 0

        if tx.is_fraud_prediction:

            grouped[day] += 1

    return grouped

# =========================================================
# REALTIME ANALYTICS
# =========================================================

@app.get(
    "/analytics/realtime",
    tags=["Analytics"]
)

def realtime_analytics(
    db: Session = Depends(get_db)
):

    return {

        "system_health": "Operational",

        "latency_ms": 12.4,

        "throughput": "2.7k/s",

        "active_models": 3,

        "risk_heatmap": [

            {
                "lat": 48.8566,
                "lng": 2.3522,
                "intensity": 0.8
            },

            {
                "lat": 40.7128,
                "lng": -74.0060,
                "intensity": 0.5
            },

            {
                "lat": 51.5074,
                "lng": -0.1278,
                "intensity": 0.6
            }
        ]
    }

# =========================================================
# MODEL REGISTRY
# =========================================================

@app.get("/models", tags=["Models"])
def list_models(
    db: Session = Depends(get_db)
):

    return db.query(
        ModeleAnalyse
    ).all()

# =========================================================

@app.post(
    "/models/upload",
    tags=["Models"]
)

async def upload_model(

    name: str,

    version: str,

    type_m: str,

    file: UploadFile = File(...),

    db: Session = Depends(get_db)
):

    os.makedirs(
        "app/models",
        exist_ok=True
    )

    path = f"app/models/{file.filename}"

    with open(path, "wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    new_model = ModeleAnalyse(

        nom=name,

        version=version,

        type=type_m,

        fichier=path,

        isActive=False
    )

    db.add(new_model)

    db.commit()

    return {

        "id": new_model.idModele,

        "status": "uploaded"
    }

# =========================================================
# WEBSOCKET ALERTS
# =========================================================

@app.websocket("/ws/alerts")
async def websocket_alerts(
    websocket: WebSocket
):

    await manager.connect(websocket)

    try:

        while True:

            data = await websocket.receive_text()

            if data == "ping":

                await websocket.send_text("pong")

    except WebSocketDisconnect:

        manager.disconnect(websocket)
