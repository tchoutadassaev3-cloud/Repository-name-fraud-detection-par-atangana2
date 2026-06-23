import requests
import random
import time
from datetime import datetime

API_URL = "http://127.0.0.1:8000/transactions/simulate"
#API_URL = "http://127.0.0.1:8000/transactions"
#API_URL = "https://repository-name-fraud-detection-par.onrender.com/transactions/"
#API_URL = "https://repository-name-fraud-detection-par.onrender.com/transactions/simulate"

# =====================================================
# VILLES CAMEROUN
# =====================================================

CITIES = [
    {
        "city": "Yaounde",
        "state": "Centre",
        "zip": "00237",
        "lat": 3.8480,
        "long": 11.5021,
        "population": 3000000
    },
    {
        "city": "Douala",
        "state": "Littoral",
        "zip": "00236",
        "lat": 4.0511,
        "long": 9.7679,
        "population": 4000000
    },
    {
        "city": "Bafoussam",
        "state": "Ouest",
        "zip": "00238",
        "lat": 5.4781,
        "long": 10.4170,
        "population": 900000
    },
    {
        "city": "Garoua",
        "state": "Nord",
        "zip": "00239",
        "lat": 9.3265,
        "long": 13.3958,
        "population": 600000
    },
    {
        "city": "Bamenda",
        "state": "Nord-Ouest",
        "zip": "00240",
        "lat": 5.9631,
        "long": 10.1591,
        "population": 700000
    }
]

# =====================================================
# MARCHANDS NORMAUX
# =====================================================

NORMAL_MERCHANTS = [
    ("Jumia Cameroon", "shopping_net"),
    ("Glotelho", "shopping_net"),
    ("Carrefour Market", "grocery_pos"),
    ("Mahima Supermarket", "grocery_pos"),
    ("TotalEnergies", "gas_transport"),
    ("Tradex", "gas_transport"),
    ("Orange Money", "misc_net"),
    ("MTN Mobile Money", "misc_net"),
    ("Canal Plus", "home"),
    ("Dovv", "shopping_net")
]

# =====================================================
# MARCHANDS FRAUDE
# =====================================================

FRAUD_MERCHANTS = [
    ("shady_site_05", "luxury_item"),
    ("luxury_watch_04", "luxury_item"),
    ("fake_jumia_store", "shopping_net")
]

# =====================================================
# JOBS
# =====================================================

JOBS = [
    "Ingenieur",
    "Docteur",
    "Commercant",
    "Etudiant",
    "Professeur",
    "Fonctionnaire",
    "Analyste",
    "Informaticien",
    "Banquier",
    "Comptable"
]

# =====================================================
# CARTES
# =====================================================

CARDS = [
    "4532015112830366",
    "4485275742308327",
    "4556737586899855",
    "4917610000000000",
    "4539578763621486",
    "4556123412341234",
    "4485123456789012",
    "4929123412345678",
    "4532876543211234",
    "4555987654321123"
]

DEVICES = [
    "Desktop",
    "Android",
    "iPhone",
    "Tablet"
]

BROWSERS = [
    "Chrome",
    "Firefox",
    "Safari",
    "Edge"
]

# =====================================================
# BUILD TRANSACTION
# =====================================================

def build_transaction(is_fraud=False):

    city = random.choice(CITIES)

    customer_lat = city["lat"]
    customer_long = city["long"]

    if is_fraud:

        merchant, category = random.choice(
            FRAUD_MERCHANTS
        )

        amount = round(
            random.uniform(800, 3000),
            2
        )

        merchant_lat = random.uniform(
            35.0,
            50.0
        )

        merchant_long = random.uniform(
            -90.0,
            -70.0
        )

    else:

        merchant, category = random.choice(
            NORMAL_MERCHANTS
        )

        amount = round(
            random.uniform(5, 150),
            2
        )

        merchant_lat = (
            customer_lat +
            random.uniform(-0.03, 0.03)
        )

        merchant_long = (
            customer_long +
            random.uniform(-0.03, 0.03)
        )

    return {

        # ===================================
        # MONTANT
        # ===================================

        "amt": amount,

        # ===================================
        # MERCHANT
        # ===================================

        "merchant": merchant,
        "category": category,

        # ===================================
        # USER
        # ===================================

        "city_pop": city["population"],
        "job": random.choice(JOBS),
        "gender": random.choice(["M", "F"]),

        "city": city["city"],
        "state": city["state"],
        "zip": city["zip"],

        "card_num": random.choice(CARDS),

        # ===================================
        # TIME
        # ===================================

        "unix_time": int(time.time()),
        "hour": datetime.now().hour,
        "day": datetime.now().weekday(),

        # ===================================
        # IMPORTANT
        # ===================================
        # TON BACKEND ATTEND CES NOMS
        # ===================================

        "customer_lat": customer_lat,
        "customer_long": customer_long,

        "merchant_lat": merchant_lat,
        "merchant_long": merchant_long,

        # ===================================
        # EXTRA
        # ===================================

        "country_code": "CM",
        "currency": "XAF",

        "device_type": random.choice(
            DEVICES
        ),

        "browser": random.choice(
            BROWSERS
        )
    }

# =====================================================
# SEND
# =====================================================

def send_transaction(is_fraud=False):

    payload = build_transaction(
        is_fraud
    )

    tx_type = (
        "FRAUD"
        if is_fraud
        else "NORMAL"
    )

    print(
        f"\n[{tx_type}] "
        f"{payload['merchant']} | "
        f"{payload['city']} | "
        f"{payload['amt']}"
    )

    try:

        response = requests.post(
            API_URL,
            json=payload,
            timeout=20
        )

        if response.status_code == 200:

            result = response.json()

            print(
                f"[+] Risk={result.get('risk_level')} | "
                f"Status={result.get('status')} | "
                f"Fraud={result.get('prediction')}"
            )

        else:

            print(
                f"[{response.status_code}]",
                response.text
            )

    except Exception as e:

        print(
            "[ERROR]",
            str(e)
        )

# =====================================================
# MAIN
# =====================================================

if __name__ == "__main__":

    print(
        "\n=== CAMEROON FRAUD SIMULATOR ==="
    )

    try:

        while True:

            for _ in range(
                random.randint(5, 10)
            ):

                send_transaction(False)

                time.sleep(
                    random.uniform(
                        1,
                        2
                    )
                )

            send_transaction(True)

            time.sleep(
                random.uniform(
                    2,
                    4
                )
            )

    except KeyboardInterrupt:

        print(
            "\nSimulation arrêtée."
        )