import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.linear_model import BayesianRidge
from xgboost import XGBClassifier
from imblearn.ensemble import BalancedRandomForestClassifier
from category_encoders import TargetEncoder
from sklearn.metrics import (
    classification_report, 
    average_precision_score, 
    roc_auc_score, 
    precision_recall_curve,
    confusion_matrix
)

# Configuration
DATA_PATH = "data/fraudTrain.csv"
OUTPUT_DIR = "research/outputs/"
MODEL_DIR = "app/models/"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

class MasterScienceLab:
    def __init__(self):
        print("=== Master Science Lab v2.0 ===")
        self.scaler = RobustScaler()
        self.encoder = TargetEncoder()
        self.xgb = XGBClassifier(n_estimators=300, max_depth=6, learning_rate=0.05, eval_metric='aucpr')
        self.brf = BalancedRandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
        self.meta_learner = BayesianRidge()

    def process_data(self, df):
        print("[1/4] Feature Engineering...")
        df['dist'] = np.sqrt((df['lat'] - df['merch_lat'])**2 + (df['long'] - df['merch_long'])**2)
        df['date'] = pd.to_datetime(df['trans_date_trans_time'])
        df['hour'] = df['date'].dt.hour
        df['day'] = df['date'].dt.dayofweek
        
        # Select target features from class diagram requirements
        features = ['category', 'amt', 'city_pop', 'job', 'unix_time', 'dist', 'hour', 'day']
        X = df[features]
        y = df['is_fraud']
        return X, y

    def run_metrology(self, X_train, y_train):
        print("[2/4] Metrology: Isolation Forest Filtering...")
        iso = IsolationForest(contamination=0.01, random_state=42)
        mask_legit = (y_train == 0)
        X_legit = X_train[mask_legit]
        
        # Fit on legitimate transactions to identify statistical anomalies
        anomalies = iso.fit_predict(X_legit)
        X_pure_legit = X_legit[anomalies == 1]
        
        # Rebuild pure dataset
        X_fraud = X_train[y_train == 1]
        X_pure = np.vstack([X_pure_legit, X_fraud])
        y_pure = np.concatenate([np.zeros(len(X_pure_legit)), np.ones(len(X_fraud))])
        
        print(f"    -> Filtered {len(X_legit) - len(X_pure_legit)} baseline anomalies.")
        return X_pure, y_pure

    def train_and_eval(self, df):
        X, y = self.process_data(df)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
        
        # Preprocessing
        print("    -> Encoding / Scaling...")
        X_train_enc = self.encoder.fit_transform(X_train, y_train)
        X_test_enc = self.encoder.transform(X_test)
        X_train_scaled = self.scaler.fit_transform(X_train_enc)
        X_test_scaled = self.scaler.transform(X_test_enc)
        
        # Stage 1: Isolation Forest
        X_pure, y_pure = self.run_metrology(X_train_scaled, y_train)
        
        # Stage 2: Stacking (Fold split for meta-learner)
        print("[3/4] Training Hybrid Stacking Ensemble...")
        X_s1, X_val, y_s1, y_val = train_test_split(X_pure, y_pure, test_size=0.3, stratify=y_pure)
        
        self.xgb.fit(X_s1, y_s1)
        self.brf.fit(X_s1, y_s1)
        
        # Stage 3: Bayesian Nexus Calibration
        p1 = self.xgb.predict_proba(X_val)[:, 1]
        p2 = self.brf.predict_proba(X_val)[:, 1]
        meta_X = np.column_stack((p1, p2))
        self.meta_learner.fit(meta_X, y_val)
        
        # Stage 4: Visual Validation
        print("[4/4] Generating Scientific Proof (Metrics & Charts)...")
        self.generate_reports(X_test_scaled, y_test)
        
        # Export
        print("[+] Exporting production objects to app/models/...")
        joblib.dump(self.scaler, f"{MODEL_DIR}scaler.joblib")
        joblib.dump(self.encoder, f"{MODEL_DIR}encoder.joblib")
        joblib.dump(self.xgb, f"{MODEL_DIR}xgb_base.joblib")
        joblib.dump(self.brf, f"{MODEL_DIR}brf_base.joblib")
        joblib.dump(self.meta_learner, f"{MODEL_DIR}nexus_meta.joblib")

    def generate_reports(self, X_test, y_test):
        p1 = self.xgb.predict_proba(X_test)[:, 1]
        p2 = self.brf.predict_proba(X_test)[:, 1]
        meta_X = np.column_stack((p1, p2))
        probs = self.meta_learner.predict(meta_X)
        preds = (probs > 0.5).astype(int)
        
        # 1. Precision-Recall Curve
        precision, recall, _ = precision_recall_curve(y_test, probs)
        plt.figure(figsize=(8, 6))
        plt.plot(recall, precision, color='blue', lw=2, label=f'AUPRC = {average_precision_score(y_test, probs):.4f}')
        plt.fill_between(recall, precision, alpha=0.2, color='blue')
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.title('Science Lab: Precision-Recall Validation')
        plt.legend()
        plt.savefig(f"{OUTPUT_DIR}pr_curve.png")
        
        # 2. Confusion Matrix
        cm = confusion_matrix(y_test, preds)
        plt.figure(figsize=(6, 5))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
        plt.title('Forensic Confusion Matrix')
        plt.savefig(f"{OUTPUT_DIR}confusion_matrix.png")
        
        print("\n--- PERFORMANCE SUMMARY ---")
        print(classification_report(y_test, preds))
        print(f"AUPRC : {average_precision_score(y_test, probs):.4f}")

if __name__ == "__main__":
    df = pd.read_csv(DATA_PATH, nrows=100000)
    lab = MasterScienceLab()
    lab.train_and_eval(df)
