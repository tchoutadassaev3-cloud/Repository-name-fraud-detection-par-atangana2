import requests
import time
import random
import json

# API_URL = "http://localhost:8000/transactions/"
#API_URL = "https://repository-name-fraud-detection-par.onrender.com/transactions/"
API_URL = "https://repository-name-fraud-detection-par.onrender.com/transactions/simulate"

CATEGORIES = ['gas_transport', 'grocery_pos', 'home', 'shopping_net', 'misc_net']
MERCHANTS = ['gas_station_01', 'supermarket_02', 'online_shop_03', 'luxury_watch_04', 'shady_site_05']
JOBS = ['Engineer', 'Doctor', 'Scientist', 'Analyst']


def simulate_transaction(is_fraudulent=False):

    trans = {
        # 💰 transaction amount
        "amt": round(random.uniform(10, 50), 2) if not is_fraudulent else round(random.uniform(800, 2000), 2),

        # 🏷️ category
        "category": random.choice(CATEGORIES) if not is_fraudulent else "luxury_item",

        # 🏪 merchant
        "merchant": random.choice(MERCHANTS),

        # 👤 user info (IMPORTANT backend fields)
        "city_pop": 100000,
        "job": random.choice(JOBS),
        "gender": random.choice(["M", "F"]),

        # 🌍 location
        "city": "Yaounde",
        "state": "Centre",
        "zip": "00237",

        # 💳 card (IMPORTANT FIX ERROR KEYERROR)
        "card_num": "4532015112830366",

        # ⏱️ time features
        "unix_time": int(time.time()),
        "hour": time.localtime().tm_hour,
        "day": time.localtime().tm_wday,

        # 📍 coordinates (normal vs fraud logic)
        "lat": 48.8566,
        "long": 2.3522,

        "merch_lat": 48.8566 if not is_fraudulent else 40.7128,
        "merch_long": 2.3522 if not is_fraudulent else -74.0060
    }

    # 📏 distance feature (important for ML model)
    trans["dist"] = round(
        ((trans["lat"] - trans["merch_lat"]) ** 2 +
         (trans["long"] - trans["merch_long"]) ** 2) ** 0.5,
        6
    )

    print(f"\n[*] Sending {'FRAUDULENT' if is_fraudulent else 'NORMAL'} transaction: ${trans['amt']}")

    try:
        response = requests.post(API_URL, json=trans, timeout=10)

        # ✅ success
        if response.status_code == 200:
            result = response.json()
            print(f"[+] Score = {result.get('score')} | Fraud = {result.get('is_fraud')}")

        # ❌ backend error (VERY IMPORTANT DEBUG)
        else:
            print(f"[ERROR {response.status_code}] {response.text}")

    except Exception as e:
        print(f"[CONNECTION ERROR] {e}")


if __name__ == "__main__":
    print("\n=== ULTRA FRAUD SIMULATION STARTED ===")
    print("Backend:", API_URL)

    try:
        while True:

            # 🔵 normal transactions
            for _ in range(random.randint(1, 3)):
                simulate_transaction(False)
                time.sleep(1.5)

            # 🔴 fraud transaction
            simulate_transaction(True)
            time.sleep(3)

    except KeyboardInterrupt:
        print("\n[STOPPED] Simulation ended.")