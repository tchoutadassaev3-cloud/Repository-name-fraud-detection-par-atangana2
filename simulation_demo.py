import requests
import time
import random
import json

API_URL = "http://localhost:8000/transactions/"

CATEGORIES = ['gas_transport', 'grocery_pos', 'home', 'shopping_net', 'misc_net']
MERCHANTS = ['gas_station_01', 'supermarket_02', 'online_shop_03', 'luxury_watch_04', 'shady_site_05']
JOBS = ['Engineer', 'Doctor', 'Scientist', 'Analyst']

def simulate_transaction(is_fraudulent=False):
    trans = {
        "amt": random.uniform(10, 50) if not is_fraudulent else random.uniform(800, 2000),
        "category": random.choice(CATEGORIES) if not is_fraudulent else "luxury_item",
        "merchant": random.choice(MERCHANTS),
        "city_pop": 100000,
        "job": random.choice(JOBS),
        "unix_time": int(time.time()),
        "lat": 48.8566,
        "long": 2.3522,
        "merch_lat": 48.8566 if not is_fraudulent else 40.7128, # distant merchant for fraud
        "merch_long": 2.3522 if not is_fraudulent else -74.0060,
        "hour": time.localtime().tm_hour,
        "day": time.localtime().tm_wday
    }
    
    # Calculate dist for the model
    dist = ((trans["lat"] - trans["merch_lat"])**2 + (trans["long"] - trans["merch_long"])**2)**0.5
    trans["dist"] = dist
    
    print(f"[*] Sending {'FRAUDULENT ' if is_fraudulent else 'Normal '} transaction: ${trans['amt']}")
    try:
        response = requests.post(API_URL, json=trans)
        if response.status_code == 200:
            result = response.json()
            print(f"  [+] Response: Score={result['score']:.4f}, Fraud={result['is_fraud']}")
        else:
            print(f"  [-] Error: {response.text}")
    except Exception as e:
        print(f"  [-] Connection error: {e}")

if __name__ == "__main__":
    print("=== ULTRA FRAUD SIMULATION STARTED ===")
    print("Ensure the FastAPI backend is running on port 8000")
    
    try:
        while True:
            # Send few normal ones
            for _ in range(random.randint(1, 4)):
                simulate_transaction(is_fraudulent=False)
                time.sleep(2)
            
            # Send one suspicious one
            simulate_transaction(is_fraudulent=True)
            time.sleep(5)
    except KeyboardInterrupt:
        print("\n[*] Simulation stopped.")
