import os
import uuid
import joblib
import datetime
import numpy as np
import pandas as pd

from .models import (
    ModeleAnalyse,
    ResultatAnalyse,
    Alerte
)

# =========================================================
# MODEL STORAGE
# =========================================================

MODEL_STORAGE = "app/models/"


# =========================================================
# FRAUD INFERENCE SERVICE
# =========================================================

class FraudInferenceService:

    def __init__(self, db_session):

        self.db = db_session

        self.scaler = None
        self.encoder = None

        self.xgb = None
        self.brf = None
        self.nexus = None

        self.model_info = None

    # =====================================================
    # LOAD ACTIVE MODEL
    # =====================================================

    def _load_active_model(self):

        try:

            self.scaler = joblib.load(
                os.path.join(
                    MODEL_STORAGE,
                    "scaler.joblib"
                )
            )

            self.encoder = joblib.load(
                os.path.join(
                    MODEL_STORAGE,
                    "encoder.joblib"
                )
            )

            self.xgb = joblib.load(
                os.path.join(
                    MODEL_STORAGE,
                    "xgb_base.joblib"
                )
            )

            self.brf = joblib.load(
                os.path.join(
                    MODEL_STORAGE,
                    "brf_base.joblib"
                )
            )

            self.nexus = joblib.load(
                os.path.join(
                    MODEL_STORAGE,
                    "nexus_meta.joblib"
                )
            )
            
            print(
                  "NEXUS FEATURES =",
                  self.nexus.n_features_in_
            )
            
            print(
                "XGB FEATURES =",
                self.xgb.n_features_in_
            )

            print(
                "BRF FEATURES =",
                self.brf.n_features_in_
            )


        # ============================================
        # Fake model metadata for reporting
        # ============================================
        
            self.model_info = type(
                "ModelInfo",
                (),
                {
                    "nom": "NEXUS AI STACK",
                    "idModele": "LOCAL_MODEL"
                }
            )()

            print("[+] ML artifacts loaded successfully")

            return True

        except Exception as e:

            print(f"[!] Critical loading error: {e}")

            return False

    # =====================================================
    # FEATURE ENGINEERING
    # =====================================================

    def engineer_features(self, transaction):

        # -------------------------------------------------
        # Distance calculation
        # -------------------------------------------------

        dist = np.sqrt(
            (
                transaction.customer_lat -
                transaction.merchant_lat
            ) ** 2
            +
            (
                transaction.customer_long -
                transaction.merchant_long
            ) ** 2
        )

        # -------------------------------------------------
        # Time features
        # -------------------------------------------------

        current_time = transaction.dateHeure

        hour = current_time.hour

        day = current_time.weekday()

        # -------------------------------------------------
        # Build dataframe
        # -------------------------------------------------

        data = {

            "category": [transaction.category],

            "amt": [transaction.montant],

            "city_pop": [transaction.city_pop],

            "job": [transaction.customer_job],

            "unix_time": [transaction.unix_time],

            "dist": [dist],

            "hour": [hour],

            "day": [day]
        }

        df = pd.DataFrame(data)

        return df

    # =====================================================
    # DETERMINE RISK LEVEL
    # =====================================================

    def determine_risk_level(self, score):

        if score >= 0.90:
            return "Critical"

        elif score >= 0.70:
            return "High"

        elif score >= 0.40:
            return "Medium"

        return "Low"

    # =====================================================
    # ANALYZE TRANSACTION
    # =====================================================

    def analyze(self, transaction):

        # -------------------------------------------------
        # Load model
        # -------------------------------------------------

        if not self._load_active_model():

            return self._fallback_rule_analysis(
                transaction
            )

        # -------------------------------------------------
        # Start timer
        # -------------------------------------------------

        start_time = datetime.datetime.now()

        # -------------------------------------------------
        # Feature Engineering
        # -------------------------------------------------

        X = self.engineer_features(transaction)

        # -------------------------------------------------
        # Encoding
        # -------------------------------------------------

        X_encoded = self.encoder.transform(X)

        # -------------------------------------------------
        # Scaling
        # -------------------------------------------------

        X_scaled = self.scaler.transform(X_encoded)

        # -------------------------------------------------
        # Base Learners
        # -------------------------------------------------

        p1 = self.xgb.predict_proba(
            X_scaled
        )[:, 1]

        p2 = self.brf.predict_proba(
            X_scaled
        )[:, 1]

        # -------------------------------------------------
        # Meta Features
        # -------------------------------------------------

        meta_X = np.column_stack((p1, p2))

        # -------------------------------------------------
        # Final Probability
        # -------------------------------------------------

        fraud_score = self.nexus.predict_proba(
            meta_X
        )[:, 1][0]
        
        print("=" * 50)
        print("AMOUNT :", transaction.montant)
        print("CATEGORY :", transaction.category)
        print("P1 :", p1[0])
        print("P2 :", p2[0])
        print("FRAUD SCORE :", fraud_score)
        print("=" * 50)
        
        print("=" * 50)
        print("AMOUNT :", transaction.montant)
        print("CATEGORY :", transaction.category)
        print("P1 :", p1[0])
        print("P2 :", p2[0])
        print("META :", meta_X)
        print("=" * 50)
        
        fraud_score = self.nexus.predict_proba(
            meta_X
        )[:,1][0]
        
        # =====================================
        # BUSINESS RULES - CAMEROUN
        # =====================================
        
        amount_fcfa = transaction.montant * 650
        
        # Très gros montant
        if amount_fcfa >= 1000000:
            
            fraud_score = max(
                fraud_score,
                0.95
            )
            
        # Gros montant
        elif amount_fcfa >= 250000:
            
            fraud_score = max(
              fraud_score,
              0.60
            )  
        
        # Site suspect
        if transaction.merchant == "shady_site_05":
            
            fraud_score = max(
                fraud_score,
                0.85
            )
            
        # Achat luxe
        if transaction.category == "luxury_item":
            
            fraud_score = max(
                fraud_score,
                0.70
                
            )
                    
        print("FINAL SCORE :", fraud_score)

        # -------------------------------------------------
        # Fraud Decision
        # -------------------------------------------------

        is_fraud = fraud_score >= 0.5

        # -------------------------------------------------
        # Risk Level
        # -------------------------------------------------

        risk_level = self.determine_risk_level(
            fraud_score
        )

        # -------------------------------------------------
        # Transaction Status
        # -------------------------------------------------

        if fraud_score >= 0.90:

            transaction.status = "Refusé"

        elif fraud_score >= 0.60:

            transaction.status = "En Attente"

        else:

            transaction.status = "Accepté"

        # -------------------------------------------------
        # Save prediction in transaction
        # -------------------------------------------------

        transaction.fraud_probability = float(
            fraud_score
        )

        transaction.is_fraud_prediction = bool(
            is_fraud
        )

        transaction.risk_level = risk_level

        # -------------------------------------------------
        # Additional calculated fields
        # -------------------------------------------------
        
        current_time = transaction.dateHeure
        
        hour = current_time.hour
        
        day = current_time.weekday()

        transaction.distance_km = round(
            float(
                np.sqrt(
                    (
                        transaction.customer_lat -
                        transaction.merchant_lat
                    ) ** 2
                    +
                    (
                        transaction.customer_long -
                        transaction.merchant_long
                    ) ** 2
                ) * 111
            ),
            2
        )

        transaction.transaction_hour = hour

        transaction.transaction_day = day

        # -------------------------------------------------
        # End timer
        # -------------------------------------------------

        end_time = datetime.datetime.now()

        duration = int(
            (
                end_time - start_time
            ).total_seconds() * 1000
        )

        # =================================================
        # CREATE RESULT ENTITY
        # =================================================

        resultat = ResultatAnalyse(

            idResultat=str(uuid.uuid4()),

            scoreFraude=float(fraud_score),

            details=(
                f"Hybrid ML inference "
                f"using model "
                f"{self.model_info.nom}"
            ),

            seuilApplique="0.5",

            dureeAnalyseMs=duration,

            transaction_id=transaction.idTransaction,

            modele_id=self.model_info.idModele
        )

        # =================================================
        # AUTO ALERT GENERATION
        # =================================================

        if fraud_score >= 0.70:

            alerte = Alerte(

                idAlerte=str(uuid.uuid4()),

                niveau=risk_level,

                statut="Ouverte",

                commentaires=(
                    f"Automatic fraud alert "
                    f"generated with score "
                    f"{fraud_score:.2f}"
                ),

                resultat=resultat
            )

            self.db.add(alerte)

        # -------------------------------------------------
        # Save everything
        # -------------------------------------------------

        self.db.add(resultat)

        self.db.commit()

        self.db.refresh(resultat)

        return resultat

    # =====================================================
    # FALLBACK RULE MODE
    # =====================================================

    def _fallback_rule_analysis(self, transaction):

        # -------------------------------------------------
        # Distance calculation
        # -------------------------------------------------

        dist = np.sqrt(
            (
                transaction.customer_lat -
                transaction.merchant_lat
            ) ** 2
            +
            (
                transaction.customer_long -
                transaction.merchant_long
            ) ** 2
        )

        # -------------------------------------------------
        # Simple fallback fraud logic
        # -------------------------------------------------

        if (
            transaction.montant > 300000
            or dist > 20
        ):

            score = 0.95

        elif transaction.montant > 100000:

            score = 0.75

        else:

            score = 0.10

        # -------------------------------------------------
        # Risk level
        # -------------------------------------------------

        risk_level = self.determine_risk_level(
            score
        )

        # -------------------------------------------------
        # Transaction status
        # -------------------------------------------------

        transaction.status = (
            "Refusé"
            if score >= 0.90
            else "Accepté"
        )

        # -------------------------------------------------
        # Save predictions
        # -------------------------------------------------

        transaction.fraud_probability = float(
            score
        )

        transaction.is_fraud_prediction = (
            score >= 0.5
        )

        transaction.risk_level = risk_level

        # -------------------------------------------------
        # Extra frontend fields
        # -------------------------------------------------

        transaction.distance_km = round(
            float(dist * 111),
            2
        )

        transaction.transaction_hour = (
            transaction.dateHeure.hour
        )

        transaction.transaction_day = (
            transaction.dateHeure.weekday()
        )

        # =================================================
        # CREATE RESULT
        # =================================================

        resultat = ResultatAnalyse(

            idResultat=str(uuid.uuid4()),

            scoreFraude=score,

            details=(
                "Fallback degraded mode "
                "(static rules)"
            ),

            seuilApplique="Static Rule",

            dureeAnalyseMs=0,

            transaction_id=transaction.idTransaction
        )

        return resultat