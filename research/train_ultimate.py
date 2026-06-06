import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.linear_model import BayesianRidge
from xgboost import XGBClassifier
from imblearn.ensemble import BalancedRandomForestClassifier
from category_encoders import TargetEncoder
from sklearn.metrics import classification_report, average_precision_score, roc_auc_score

# Constants
DATA_PATH = "data/fraudTrain.csv"
MODEL_DIR = "app/models/"
os.makedirs(MODEL_DIR, exist_ok=True)

class MasterScienceLab:
    def __init__(self):
        self.scaler = RobustScaler()
        self.encoder = TargetEncoder()
        # High-performance base learners
        self.xgb = XGBClassifier(
            n_estimators=500,
            max_depth=6,
            learning_rate=0.05,
            scale_pos_weight=50, # Handle imbalance roughly
            use_label_encoder=False,
            eval_metric='aucpr'
        )
        self.brf = BalancedRandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            sampling_strategy='auto'
        )
        # Bayesian Nexus Meta-Learner
        self.meta_learner = BayesianRidge()

    def process_data(self, df):
        print("[*] Engineering features...")
        # 1. Feature Engineering: Distance calculation
        df['dist'] = np.sqrt((df['lat'] - df['merch_lat'])**2 + (df['long'] - df['merch_long'])**2)
        
        # 2. Time features
        df['trans_date_trans_time'] = pd.to_datetime(df['trans_date_trans_time'])
        df['hour'] = df['trans_date_trans_time'].dt.hour
        df['day'] = df['trans_date_trans_time'].dt.dayofweek
        
        # 3. Target Selection
        features = ['category', 'amt', 'city_pop', 'job', 'unix_time', 'dist', 'hour', 'day']
        X = df[features]
        y = df['is_fraud']
        
        return X, y

    def train(self, df):
        X, y = self.process_data(df)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
        
        print("[*] Encoding and Scaling...")
        X_train_encoded = self.encoder.fit_transform(X_train, y_train)
        X_test_encoded = self.encoder.transform(X_test)
        
        X_train_scaled = self.scaler.fit_transform(X_train_encoded)
        X_test_scaled = self.scaler.transform(X_test_encoded)
        
        # --- Isolation Forest Filtering ---
        print("[*] Filtering anomalies with Isolation Forest...")
        iso_forest = IsolationForest(contamination=0.01, random_state=42)
        # We only filter the legitimate transactions (label 0) to avoid removing actual fraud
        mask_legit = (y_train == 0)
        X_legit = X_train_scaled[mask_legit]
        
        iso_preds = iso_forest.fit_predict(X_legit)
        # iso_preds == 1 means normal, -1 means anomaly
        clean_legit_X = X_legit[iso_preds == 1]
        
        # Reconstruct X_train_scaled and y_train with cleaned legit data
        X_fraud = X_train_scaled[y_train == 1]
        X_train_pure = np.vstack([clean_legit_X, X_fraud])
        y_train_pure = np.concatenate([np.zeros(len(clean_legit_X)), np.ones(len(X_fraud))])
        
        print(f"[+] Purified dataset: Removed {len(X_legit) - len(clean_legit_X)} anomalies from the legit class.")
        
        print("[*] Training Base Learners...")
        # We split train into 2 folds for stalling to avoid leakage
        X_sub_train, X_val, y_sub_train, y_val = train_test_split(X_train_pure, y_train_pure, test_size=0.3, stratify=y_train_pure)
        
        self.xgb.fit(X_sub_train, y_sub_train)
        self.brf.fit(X_sub_train, y_sub_train)
        
        # Generate Meta-features
        p1 = self.xgb.predict_proba(X_val)[:, 1]
        p2 = self.brf.predict_proba(X_val)[:, 1]
        meta_X = np.column_stack((p1, p2))
        
        print("[*] Calibrating Bayesian Nexus...")
        self.meta_learner.fit(meta_X, y_val)
        
        # Evaluation
        self.evaluate(X_test_scaled, y_test)
        
        print("[*] Exporting Models to app/models/...")
        joblib.dump(self.scaler, f"{MODEL_DIR}scaler.joblib")
        joblib.dump(self.encoder, f"{MODEL_DIR}encoder.joblib")
        joblib.dump(self.xgb, f"{MODEL_DIR}xgb_base.joblib")
        joblib.dump(self.brf, f"{MODEL_DIR}brf_base.joblib")
        joblib.dump(self.meta_learner, f"{MODEL_DIR}nexus_meta.joblib")
        
    def evaluate(self, X_test, y_test):
        p1 = self.xgb.predict_proba(X_test)[:, 1]
        p2 = self.brf.predict_proba(X_test)[:, 1]
        meta_X = np.column_stack((p1, p2))
        
        final_probs = self.meta_learner.predict(meta_X)
        final_preds = (final_probs > 0.5).astype(int)
        
        print("\n--- PERFORMANCE REPORT ---")
        print(classification_report(y_test, final_preds))
        print(f"AUPRC: {average_precision_score(y_test, final_probs):.4f}")
        print(f"ROC-AUC: {roc_auc_score(y_test, final_probs):.4f}")

if __name__ == "__main__":
    # For PoC purposes, we use a sample if the dataset is massive
    print("[*] Loading dataset...")
    df = pd.read_csv(DATA_PATH, nrows=200000) # Fast PoC training
    lab = MasterScienceLab()
    lab.train(df)
