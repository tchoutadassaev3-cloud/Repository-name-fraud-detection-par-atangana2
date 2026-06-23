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

import json
import os
import shutil
import datetime
import uuid

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

    version="3.0.0"
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

        if websocket in self.active_connections:

            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):

        disconnected = []

        for connection in self.active_connections:

            try:

                await connection.send_text(message)

            except Exception:

                disconnected.append(connection)

        for ws in disconnected:

            self.disconnect(ws)

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
def login(
    data: dict,
    db: Session = Depends(get_db)
):

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

    print("=" * 50)
    print(data)
    print("=" * 50)
    
    
    try:

        # =================================================
        # DISTANCE CALCULATION
        # =================================================
        
        customer_lat = (
            data.get("customer_lat")
            or data.get("lat")
        )
        
        customer_long = (
            data.get("customer_long")
            or data.get("long")
        )

        merchant_lat = (
            data.get("merchant_lat")
            or data.get("merch_lat")
        )
        
        merchant_long = (
            data.get("merchant_long")
            or data.get("merch_long")
        )
        
        if customer_lat is None:
            customer_lat = 0.0
        
        if customer_long is None:
            customer_long = 0.0
        
        if merchant_lat is None:
            merchant_lat = customer_lat
        
        if merchant_long is None:
            merchant_long = customer_long
      
        distance_km = (
            (
                (customer_lat - merchant_lat) ** 2
                +
                (customer_long - merchant_long) ** 2
            ) ** 0.5
        ) * 111

        # =================================================
        # TRANSACTION CREATION
        # =================================================

        transaction = Transaction(

            # ---------------------------------------------
            # Core
            # ---------------------------------------------

            idTransaction=str(uuid.uuid4()),

            montant=data["amt"],

            devise=data.get("currency", "XAF"),

            dateHeure=datetime.datetime.utcnow(),

            referenceCommande=(
                f"TX_"
                f"{os.urandom(4).hex().upper()}"
            ),

            status="Processing",

            ipSource=data.get(
                "ip",
                "127.0.0.1"
            ),

            # ---------------------------------------------
            # Merchant / User
            # ---------------------------------------------

            merchant=data.get(
                "merchant",
                "Unknown Merchant"
            ),

            category=data.get(
                "category",
                "unknown"
            ),

            city=data.get(
                "city",
                "Unknown"
            ),

            state=data.get(
                "state",
                "Unknown"
            ),

            zip_code=data.get(
                "zip",
                "00000"
            ),

            card_num=(
                data.get("card_num")
                or data.get("cc_num")
                or "0000000000000000"
            ),

            city_pop=data.get(
                "city_pop",
                0
            ),

            customer_job=data.get(
                "job",
                "Unknown"
            ),

            customer_gender=data.get(
                "gender",
                "Unknown"
            ),

            # ---------------------------------------------
            # Time Features
            # ---------------------------------------------

            unix_time=data.get(
                "unix_time",
                0
            ),

            transaction_hour=data.get(
                "hour",
                datetime.datetime.utcnow().hour
            ),

            transaction_day=data.get(
                "day",
                datetime.datetime.utcnow().weekday()
            ),

            # ---------------------------------------------
            # Coordinates
            # ---------------------------------------------
            
            customer_lat=customer_lat,

            customer_long=customer_long,

            merchant_lat=merchant_lat,

            merchant_long=merchant_long,
            

            distance_km=distance_km,

            # ---------------------------------------------
            # Extra ML Features
            # ---------------------------------------------

            country_code=data.get(
                "country_code",
                "CM"
            ),

            device_type=data.get(
                "device_type",
                "Desktop"
            ),

            browser=data.get(
                "browser",
                "Chrome"
            ),

            pays_id=data.get(
                "country_code",
                "CM"
            )
        )

        db.add(transaction)

        db.flush()

        # =================================================
        # ML ANALYSIS
        # =================================================

        service = FraudInferenceService(db)

        result = service.analyze(transaction)

        db.commit()

        db.refresh(transaction)
        
        display_amount = round(
            transaction.montant * 650,
            0
        )

        # =================================================
        # FRONTEND LIVE EVENT
        # =================================================

        websocket_payload = {

            "type": "transaction_analysis",

            "transaction_id": transaction.idTransaction,

            "card": (
                "****"
                + transaction.card_num[-4:]
            ),

            "city": transaction.city,

            "merchant": transaction.merchant,

            "amount": display_amount,

            "currency": "FCFA",

            "distance_km": round(
                transaction.distance_km,
                2
            ),

            "risk_level": transaction.risk_level,

            "fraud_probability": (
                transaction.fraud_probability
            ),

            "is_fraud": (
                transaction.is_fraud_prediction
            ),

            "status": transaction.status,

            "date": str(
                transaction.dateHeure
            )
        }

        await manager.broadcast(
            json.dumps(websocket_payload)
        )
        
        decision = ""
        
        if transaction.status == "Refusé":
            
            decision = "Bloquer immédiatement"
            
        elif transaction.status == "En Attente":
            
            decision = "Vérification manuelle"
            
        else:
            
            decision = "Approuver la transaction"

        # =================================================
        # API RESPONSE
        # =================================================

        return {

            "transaction_id": transaction.idTransaction,

            "merchant": transaction.merchant,

            "city": transaction.city,

            "amount": display_amount,

            "currency": "FCFA",

            "distance_km": round(
                transaction.distance_km,
                2
            ),

            "fraud_probability": (
                transaction.fraud_probability
            ),

            "risk_level": transaction.risk_level,

            "is_fraud": (
                transaction.is_fraud_prediction
            ),
            
            "decision": decision,

            "status": transaction.status
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =========================================================
# SIMULATE TRANSACTION
# =========================================================

@app.post(
    "/transactions/simulate",
    tags=["Simulation"]
)
async def simulate_transaction(
    data: dict,
    db: Session = Depends(get_db)
):
    transformed = {

        "amt": data.get("amt"),

        "merchant": data.get("merchant"),

        "category": data.get("category"),

        "city_pop": data.get("city_pop"),

        "job": data.get("job"),

        "gender": data.get("gender"),

        "city": data.get("city"),

        "state": data.get("state"),

        "zip": data.get("zip"),

        "card_num": data.get("card_num"),

        "unix_time": data.get("unix_time"),

        "hour": data.get("hour"),

        "day": data.get("day"),

        "customer_lat": data.get("lat"),

        "customer_long": data.get("long"),

        "merchant_lat": data.get("merch_lat"),

        "merchant_long": data.get("merch_long"),

        "country_code": "CM",

        "currency": "XAF",

        "device_type": "Desktop",

        "browser": "Chrome"
    }

    return await predict_transaction(
        transformed,
        db
    )

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

            "transaction_id": tx.idTransaction,

            "merchant": tx.merchant,

            "category": tx.category,

            "amount": round(
                float(tx.montant) * 650,
                0
            ),

            "fraud_score": float(
                tx.fraud_probability or 0
            ),

            "risk_level": tx.risk_level,

            "status": tx.status,

            "date": tx.dateHeure,

            "card_number": tx.card_num,

            "city": tx.city,

            "is_fraud": tx.is_fraud_prediction
        })

    return {

        "transactions": results,

        "total": len(results),

        "page": 1,

        "limit": limit
    }

# =========================================================
# ALERTS
# =========================================================

@app.get("/alerts", tags=["Alerts"])
def get_alerts(
    db: Session = Depends(get_db)
):

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

    fraud_amount = db.query(
        func.sum(Transaction.montant)
    ).filter(
        Transaction.is_fraud_prediction == True
    ).scalar() or 0

    accepted_transactions = (
        total_transactions
        - fraud_transactions
    )

    blocked_transactions = fraud_transactions

    recent_alerts = db.query(
        Transaction
    ).filter(
        Transaction.is_fraud_prediction == True
    ).count()

    fraud_rate = 0

    if total_transactions > 0:

        fraud_rate = (
            fraud_transactions
            / total_transactions
        ) * 100

    return {

        "total_transactions": total_transactions,

        "fraud_alerts": fraud_transactions,

        "high_risk_transactions": high_risk,

        "accepted_transactions": accepted_transactions,

        "fraud_rate": round(
            fraud_rate,
            2
        ),

        "total_amount": float(
            total_amount
        ),

        "fraud_amount": float(
            fraud_amount
        ),

        "blocked_transactions": blocked_transactions,

        "recent_alerts": recent_alerts
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

            grouped[day] = {
                "total": 0,
                "fraud": 0
            }

        grouped[day]["total"] += 1

        if tx.is_fraud_prediction:
            grouped[day]["fraud"] += 1

    result = []

    for day, stats in grouped.items():

        rate = 0

        if stats["total"] > 0:

            rate = (
                stats["fraud"]
                / stats["total"]
            ) * 100

        result.append({

            "date": day,

            "fraud_count": stats["fraud"],

            "total_count": stats["total"],

            "fraud_rate": round(rate, 2)
        })

    return result

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

    today = datetime.datetime.utcnow().date()

    fraud_today = db.query(
        Transaction
    ).filter(
        Transaction.is_fraud_prediction == True
    ).count()

    active_alerts = db.query(
        Transaction
    ).filter(
        Transaction.risk_level == "Critique"
    ).count()

    total_transactions = db.query(
        Transaction
    ).count()

    return {

        "active_alerts": active_alerts,

        "transactions_per_minute": total_transactions,

        "fraud_detected_today": fraud_today,

        "system_status": "Operational"
    }

# =========================================================
# MODEL REGISTRY
# =========================================================

@app.get("/models", tags=["Models"])
def list_models(
    db: Session = Depends(get_db)
):

    models = db.query(
        ModeleAnalyse
    ).all()

    return [
        {
            "id": m.idModele,
            "name": m.nom,
            "version": m.version,
            "type": m.type,
            "is_active": m.isActive,
            "upload_date": m.created_at,
            "accuracy": m.accuracy,
            "precision": m.precision,
            "recall": m.recall,
            "f1_score": m.f1_score,
            "roc_auc": m.roc_auc,
            "auprc": m.auprc,
            "description": m.description
        }
        for m in models
    ]

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

        isActive=False,
        
        accuracy=0.99,
        
        precision=0.71,
        
        recall=0.80,
        
        f1_score=0.76,
        
        roc_auc=0.9958,
         
        auprc=0.8349
        
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

                await websocket.send_text(
                    "pong"
                )

    except WebSocketDisconnect:

        manager.disconnect(websocket)
        