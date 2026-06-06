import pandas as pd
import os

def get_stats(file_path):
    print(f"--- Stats for {file_path} ---")
    if not os.path.exists(file_path):
        print(f"File {file_path} not found.")
        return
    try:
        # Read only necessary columns to save memory
        # fraudTrain.csv uses 'is_fraud', creditcard.csv uses 'Class'
        cols = pd.read_csv(file_path, nrows=0).columns.tolist()
        target = 'is_fraud' if 'is_fraud' in cols else 'Class'
        
        # Load only the target column to be fast and memory efficient
        df = pd.read_csv(file_path, usecols=[target])
        
        total = len(df)
        fraud = df[target].sum()
        legit = total - fraud
        ratio = (fraud / total) * 100
        
        print(f"Total Transactions: {total:,}")
        print(f"Legitimate: {legit:,}")
        print(f"Fraudulent: {fraud:,}")
        print(f"Fraud Ratio: {ratio:.4f}%")
        print(f"Columns: {cols}")
        print("\n")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

datasets = ["data/fraudTrain.csv", "data/creditcard.csv", "data/creditcard_2023.csv"]
for d in datasets:
    get_stats(d)
