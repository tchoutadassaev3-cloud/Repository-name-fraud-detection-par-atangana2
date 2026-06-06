import joblib
import pandas as pd
import numpy as np
import datetime
import os
from .models import ModeleAnalyse, ResultatAnalyse, Alerte
from .database import SessionLocal

MODEL_STORAGE = "app/models/"

class FraudInferenceService:
    def __init__(self, db_session):
        self.db = db_session
        self.active_model_obj = None
        self.scaler = None
        self.encoder = None
        self.model_info = None

    def _load_active_model(self):
        # Strictly find the active 'Principal' model as per pkg diagram requirement
        model_meta = self.db.query(ModeleAnalyse).filter(
            ModeleAnalyse.isActive == True,
            ModeleAnalyse.type == 'Principal'
        ).first()

        if not model_meta:
            print("[!] No formal active principal model found.")
            return False

        try:
            self.scaler = joblib.load(os.path.join(MODEL_STORAGE, "scaler.joblib"))
            self.encoder = joblib.load(os.path.join(MODEL_STORAGE, "encoder.joblib"))
            self.xgb = joblib.load(os.path.join(MODEL_STORAGE, "xgb_base.joblib"))
            self.brf = joblib.load(os.path.join(MODEL_STORAGE, "brf_base.joblib"))
            self.nexus = joblib.load(os.path.join(MODEL_STORAGE, "nexus_meta.joblib"))
            
            self.model_info = model_meta
            return True
        except Exception as e:
            print(f"[!] Critical Error loading ML artifacts: {e}")
            return False

    def engineer_features(self, transaction_data, user_lat=-37.8136, user_long=144.9631):
        # Synchronized with Master Science Lab Benchmarks
        df = pd.DataFrame([transaction_data])
        df['dist'] = np.sqrt((user_lat - transaction_data['merch_lat'])**2 + 
                             (user_long - transaction_data['merch_long'])**2)
        
        now = datetime.datetime.now()
        df['hour'] = now.hour
        df['day'] = now.weekday()
        
        # Schema from PKG diagram feature set
        features = ['category', 'amt', 'city_pop', 'job', 'unix_time', 'dist', 'hour', 'day']
        return df[features]

    def analyze(self, transaction):
        """
        Implements the Activity Diagram (stm) sequence:
        Acquisition -> Preprocessing -> Scoring -> Decision (Accepted/Refused/Alert)
        """
        if not self._load_active_model():
            # "Mode Dégradé (Règles)" fallback as per stm diagram
            return self._fallback_rule_analysis(transaction)

        start_time = datetime.datetime.now()
        
        # Preprocessing
        X = self.engineer_features(transaction.__dict__)
        
        # Hybrid Scoring
        X_encoded = self.encoder.transform(X)
        X_scaled = self.scaler.transform(X_encoded)
        
        p1 = self.xgb.predict_proba(X_scaled)[:, 1]
        p2 = self.brf.predict_proba(X_scaled)[:, 1]
        meta_X = np.column_stack((p1, p2))
        
        fraud_score = self.nexus.predict(meta_X)[0]
        
        end_time = datetime.datetime.now()
        duration = int((end_time - start_time).total_seconds() * 1000)
        
        # formal ResultatAnalyse entity creation
        resultat = ResultatAnalyse(
            idResultat=str(uuid.uuid4()),
            scoreFraude=float(fraud_score),
            details=f"Formal Inference using {self.model_info.nom} [Production Registry]",
            seuilApplique="0.7 (Hybrid Nexus Std)",
            dureeAnalyseMs=duration,
            transaction_id=transaction.idTransaction,
            modele_id=self.model_info.idModele
        )
        
        return resultat

    def _fallback_rule_analysis(self, transaction):
        # Simple threshold rule for "Mode Dégradé"
        score = 0.9 if transaction.montant > 5000 else 0.1
        return ResultatAnalyse(
            idResultat=str(uuid.uuid4()),
            scoreFraude=score,
            details="MODE DÉGRADÉ (RÈGLES) - ML artifacts missing",
            seuilApplique="Static Rule",
            dureeAnalyseMs=0,
            transaction_id=transaction.idTransaction
        )
import uuid
