import pandas as pd
import numpy as np
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LogisticRegression

from xgboost import XGBClassifier
from imblearn.ensemble import BalancedRandomForestClassifier
from category_encoders import TargetEncoder

from sklearn.metrics import (
    classification_report,
    average_precision_score,
    roc_auc_score
)

# =========================================================
# CONFIGURATION
# =========================================================

DATA_PATH = "data/fraudTrain.csv"
MODEL_DIR = "app/models/"

os.makedirs(MODEL_DIR, exist_ok=True)

# =========================================================
# MASTER SCIENCE LAB
# =========================================================

class MasterScienceLab:

    def __init__(self):

        # -----------------------------
        # Scaler
        # -----------------------------

        self.scaler = RobustScaler()

        # -----------------------------
        # Encoder
        # -----------------------------

        self.encoder = TargetEncoder(
            handle_missing='value'
        )

        # -----------------------------
        # XGBoost Base Learner
        # -----------------------------

        self.xgb = XGBClassifier(
            n_estimators=500,
            max_depth=6,
            learning_rate=0.05,
            scale_pos_weight=50,
            use_label_encoder=False,
            eval_metric='aucpr',
            random_state=42,
            n_jobs=-1
        )

        # -----------------------------
        # Balanced Random Forest
        # -----------------------------

        self.brf = BalancedRandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            sampling_strategy='auto',
            n_jobs=-1
        )

        # -----------------------------
        # Meta Learner
        # IMPORTANT:
        # LogisticRegression gives
        # proper fraud probabilities
        # between 0 and 1
        # -----------------------------

        self.meta_learner = LogisticRegression()

    # =====================================================
    # FEATURE ENGINEERING
    # =====================================================

    def process_data(self, df):

        print("[*] Engineering features...")

        # -------------------------------------------------
        # Distance between user and merchant
        # -------------------------------------------------

        df['dist'] = np.sqrt(
            (df['lat'] - df['merch_lat'])**2 +
            (df['long'] - df['merch_long'])**2
        )

        # -------------------------------------------------
        # Time Features
        # -------------------------------------------------

        df['trans_date_trans_time'] = pd.to_datetime(
            df['trans_date_trans_time']
        )

        df['hour'] = df['trans_date_trans_time'].dt.hour

        df['day'] = df['trans_date_trans_time'].dt.dayofweek

        # -------------------------------------------------
        # Selected Features
        # -------------------------------------------------

        features = [
            'category',
            'amt',
            'city_pop',
            'job',
            'unix_time',
            'dist',
            'hour',
            'day'
        ]

        X = df[features]

        y = df['is_fraud']

        return X, y

    # =====================================================
    # TRAINING PIPELINE
    # =====================================================

    def train(self, df):

        # -------------------------------------------------
        # Process dataset
        # -------------------------------------------------

        X, y = self.process_data(df)

        # -------------------------------------------------
        # Train/Test Split
        # -------------------------------------------------

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.2,
            stratify=y,
            random_state=42
        )

        # -------------------------------------------------
        # Encoding
        # -------------------------------------------------

        print("[*] Encoding categorical features...")

        X_train_encoded = self.encoder.fit_transform(
            X_train,
            y_train
        )

        X_test_encoded = self.encoder.transform(
            X_test
        )

        # -------------------------------------------------
        # Scaling
        # -------------------------------------------------

        print("[*] Scaling features...")

        X_train_scaled = self.scaler.fit_transform(
            X_train_encoded
        )

        X_test_scaled = self.scaler.transform(
            X_test_encoded
        )

        # =================================================
        # ISOLATION FOREST
        # =================================================

        print("[*] Filtering anomalies with Isolation Forest...")

        iso_forest = IsolationForest(
            contamination=0.01,
            random_state=42,
            n_jobs=-1
        )

        # Only legitimate transactions
        mask_legit = (y_train == 0)

        X_legit = X_train_scaled[mask_legit]

        # Train IsolationForest
        iso_preds = iso_forest.fit_predict(X_legit)

        # Keep only normal legit transactions
        clean_legit_X = X_legit[iso_preds == 1]

        # Fraud samples untouched
        X_fraud = X_train_scaled[y_train == 1]

        # Rebuild purified dataset
        X_train_pure = np.vstack([
            clean_legit_X,
            X_fraud
        ])

        y_train_pure = np.concatenate([
            np.zeros(len(clean_legit_X)),
            np.ones(len(X_fraud))
        ])

        print(
            f"[+] Purified dataset: Removed "
            f"{len(X_legit) - len(clean_legit_X)} "
            f"anomalies from legitimate class."
        )

        # =================================================
        # STACKING PREPARATION
        # =================================================

        print("[*] Preparing stacking layers...")

        X_sub_train, X_val, y_sub_train, y_val = train_test_split(
            X_train_pure,
            y_train_pure,
            test_size=0.3,
            stratify=y_train_pure,
            random_state=42
        )

        # =================================================
        # BASE LEARNERS TRAINING
        # =================================================

        print("[*] Training XGBoost...")

        self.xgb.fit(
            X_sub_train,
            y_sub_train
        )

        print("[*] Training Balanced Random Forest...")

        self.brf.fit(
            X_sub_train,
            y_sub_train
        )

        # =================================================
        # META FEATURES
        # =================================================

        print("[*] Generating meta-features...")

        p1 = self.xgb.predict_proba(X_val)[:, 1]

        p2 = self.brf.predict_proba(X_val)[:, 1]

        meta_X = np.column_stack((p1, p2))

        # =================================================
        # META LEARNER
        # =================================================

        print("[*] Training Meta Learner...")

        self.meta_learner.fit(
            meta_X,
            y_val
        )

        # =================================================
        # EVALUATION
        # =================================================

        self.evaluate(
            X_test_scaled,
            y_test
        )

        # =================================================
        # EXPORT MODELS
        # =================================================

        print("[*] Exporting models...")

        joblib.dump(
            self.scaler,
            f"{MODEL_DIR}scaler.joblib"
        )

        joblib.dump(
            self.encoder,
            f"{MODEL_DIR}encoder.joblib"
        )

        joblib.dump(
            self.xgb,
            f"{MODEL_DIR}xgb_base.joblib"
        )

        joblib.dump(
            self.brf,
            f"{MODEL_DIR}brf_base.joblib"
        )

        joblib.dump(
            self.meta_learner,
            f"{MODEL_DIR}nexus_meta.joblib"
        )

        joblib.dump(
            iso_forest,
            f"{MODEL_DIR}isolation_forest.joblib"
        )

        print("\n[+] ALL MODELS SAVED SUCCESSFULLY")

    # =====================================================
    # EVALUATION
    # =====================================================

    def evaluate(self, X_test, y_test):

        print("\n[*] Evaluating model...")

        # Base learner probabilities
        p1 = self.xgb.predict_proba(X_test)[:, 1]

        p2 = self.brf.predict_proba(X_test)[:, 1]

        # Meta features
        meta_X = np.column_stack((p1, p2))

        # Final probabilities
        final_probs = self.meta_learner.predict_proba(meta_X)[:, 1]

        # Final predictions
        final_preds = (final_probs > 0.5).astype(int)

        # =================================================
        # REPORT
        # =================================================

        print("\n==============================")
        print("      PERFORMANCE REPORT")
        print("==============================\n")

        print(
            classification_report(
                y_test,
                final_preds
            )
        )

        print(
            f"AUPRC: "
            f"{average_precision_score(y_test, final_probs):.4f}"
        )

        print(
            f"ROC-AUC: "
            f"{roc_auc_score(y_test, final_probs):.4f}"
        )

# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":

    print("[*] Loading dataset...")

    # ---------------------------------------------
    # 500k rows for stable and realistic training
    # ---------------------------------------------

    df = pd.read_csv(
        DATA_PATH,
        nrows=1850000
    )

    print(f"[+] Dataset loaded: {df.shape}")

    lab = MasterScienceLab()

    lab.train(df)

