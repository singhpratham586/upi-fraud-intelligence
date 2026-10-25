import random
import datetime
from typing import List, Dict, Any, Tuple
import pandas as pd
import numpy as np

CITIES = [
    "Mumbai", "Bengaluru", "Delhi NCR", "Hyderabad", "Pune", 
    "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Kochi", "Chandigarh"
]

MERCHANT_CATEGORIES = {
    "grocery": ["Blinkit Store", "Zepto Express", "Reliance Smart", "DMart Ready", "Nature's Basket"],
    "food_dining": ["Swiggy Order", "Zomato Dine", "Starbucks Coffee", "Chai Point", "McDonald's UPI"],
    "utilities_bills": ["Tata Power BES", "MSEDCL Electricity", "Airtel Broadband", "Jio Recharge", "Indane Gas"],
    "electronics": ["Croma Retail", "Reliance Digital", "Vijay Sales", "Apple Reseller UPI", "OnePlus Store"],
    "jewelry_luxury": ["Tanishq Flagship", "Kalyan Jewellers", "CaratLane Studio", "Malabar Gold", "PC Jeweller"],
    "travel_booking": ["MakeMyTrip Air", "IRCTC Rail", "Uber India", "Ola Cabs", "IndiGo Airlines"],
    "peer_transfer": ["P2P Transfer", "Splitwise Pay", "Rent Payment", "Family Support", "Direct Contact"],
    "crypto_p2p_simulation": ["P2P Exchange Desk", "Escrow Counter", "Virtual Asset Sim"],
    "gaming_entertainment": ["Dream11 Contest", "BookMyShow", "Steam Games", "SonyLIV Sub", "PlayStation Store"]
}

DEVICE_TYPES = ["Android", "iOS", "Web"]
CHANNELS = ["UPI_APP", "QR_CODE", "PAYMENT_GATEWAY"]

def generate_synthetic_transactions(
    total_records: int = 12500,
    random_seed: int = 42
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Generates a realistic synthetic UPI transaction dataset with distinct sender profiles,
    diurnal behavior, independent ground-truth fraud scenarios, and zero data leakage in feature engineering.
    """
    random.seed(random_seed)
    np.random.seed(random_seed)

    # 1. Define Senders (400 profiles with baseline habits)
    num_users = 400
    user_profiles = {}
    for i in range(1, num_users + 1):
        uid = f"user_{i:04d}"
        profile_type = random.choices(
            ["regular", "high_value", "student_modest", "frequent_merchant"],
            weights=[0.60, 0.12, 0.18, 0.10]
        )[0]
        
        if profile_type == "regular":
            mean_amt = random.uniform(300, 1500)
            std_amt = mean_amt * random.uniform(0.3, 0.6)
            typical_txns_per_day = random.uniform(1.0, 3.5)
        elif profile_type == "high_value":
            mean_amt = random.uniform(4000, 15000)
            std_amt = mean_amt * random.uniform(0.4, 0.8)
            typical_txns_per_day = random.uniform(2.0, 5.0)
        elif profile_type == "student_modest":
            mean_amt = random.uniform(50, 400)
            std_amt = mean_amt * random.uniform(0.2, 0.5)
            typical_txns_per_day = random.uniform(0.8, 2.5)
        else: # frequent_merchant
            mean_amt = random.uniform(200, 2500)
            std_amt = mean_amt * random.uniform(0.5, 0.9)
            typical_txns_per_day = random.uniform(3.0, 7.0)

        primary_city = random.choice(CITIES)
        primary_device = f"dev_{i:04d}_{random.randint(1000, 9999)}"
        device_type = random.choices(DEVICE_TYPES, weights=[0.75, 0.20, 0.05])[0]

        user_profiles[uid] = {
            "name": f"User {i:04d}",
            "type": profile_type,
            "mean_amt": mean_amt,
            "std_amt": std_amt,
            "daily_freq": typical_txns_per_day,
            "city": primary_city,
            "device_id": primary_device,
            "device_type": device_type
        }

    # 2. Time span setup (spanning past 35 days)
    end_time = datetime.datetime(2026, 10, 25, 12, 0, 0)
    start_time = end_time - datetime.timedelta(days=35)
    total_seconds = int((end_time - start_time).total_seconds())

    # Raw transaction holder
    raw_txns = []

    # Helper: diurnal hour sampling (weighting peaks around 12-14 and 19-22)
    hour_weights = [
        0.5, 0.2, 0.1, 0.1, 0.2, 0.5,   # 00:00 - 05:00 (very low)
        1.5, 3.0, 5.0, 6.5, 7.5, 8.5,   # 06:00 - 11:00 (morning ramp)
        9.5, 9.0, 8.0, 7.5, 7.0, 8.0,   # 12:00 - 17:00 (lunch & afternoon)
        9.5, 10.0, 9.5, 8.5, 6.0, 3.0   # 18:00 - 23:00 (evening peak)
    ]
    hours = list(range(24))

    # Generate baseline normal transactions
    num_normal = int(total_records * 0.965)  # ~96.5% normal
    for i in range(num_normal):
        uid = random.choice(list(user_profiles.keys()))
        u = user_profiles[uid]

        # Select random day in period
        day_offset = random.randint(0, 34)
        hour = random.choices(hours, weights=hour_weights)[0]
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        txn_time = start_time + datetime.timedelta(days=day_offset, hours=hour, minutes=minute, seconds=second)

        # Select category
        if u["type"] == "student_modest":
            cat = random.choices(
                ["food_dining", "grocery", "peer_transfer", "gaming_entertainment"],
                weights=[0.45, 0.25, 0.20, 0.10]
            )[0]
        elif u["type"] == "high_value":
            cat = random.choices(
                ["electronics", "travel_booking", "jewelry_luxury", "peer_transfer", "utilities_bills"],
                weights=[0.25, 0.25, 0.20, 0.20, 0.10]
            )[0]
        else:
            cat = random.choices(
                list(MERCHANT_CATEGORIES.keys()),
                weights=[0.25, 0.25, 0.15, 0.08, 0.03, 0.07, 0.12, 0.01, 0.04]
            )[0]

        recv_name = random.choice(MERCHANT_CATEGORIES[cat])
        if cat == "peer_transfer":
            recv_id = f"user_{random.randint(1, num_users):04d}"
            recv_type = "individual"
        else:
            recv_id = f"mer_{abs(hash(recv_name)) % 1000:04d}"
            recv_type = "merchant"

        # Log-normal distribution around user mean
        amt = float(np.random.normal(u["mean_amt"], u["std_amt"]))
        amt = max(10.0, round(amt, 2))
        if cat == "jewelry_luxury":
            amt = max(amt, round(random.uniform(15000, 45000), 2))

        # Occasional device/city trip (normal mobility: 3% probability)
        is_traveling = (random.random() < 0.03)
        city = random.choice(CITIES) if is_traveling else u["city"]
        device_id = u["device_id"] if not is_traveling else f"{u['device_id']}_alt"

        raw_txns.append({
            "timestamp": txn_time,
            "sender_id": uid,
            "sender_name": u["name"],
            "receiver_id": recv_id,
            "receiver_name": recv_name,
            "receiver_type": recv_type,
            "merchant_category": cat,
            "amount": amt,
            "currency": "INR",
            "status": "SUCCESS" if random.random() > 0.015 else "FAILED",
            "device_id": device_id,
            "device_type": u["device_type"],
            "ip_address": f"103.{random.randint(10,250)}.{random.randint(1,254)}.{random.randint(1,254)}",
            "location_city": city,
            "channel": random.choices(CHANNELS, weights=[0.60, 0.30, 0.10])[0],
            "is_fraud_simulated": False,
            "fraud_scenario_tag": "NONE"
        })

    # 3. Inject Distinct Ground-Truth Fraud Scenarios (~3.5% = ~437 txns)
    # Scenario 1: VELOCITY_BURST (rapid high-value drain)
    for _ in range(25):
        target_uid = random.choice(list(user_profiles.keys()))
        u = user_profiles[target_uid]
        burst_time = start_time + datetime.timedelta(days=random.randint(5, 33), hours=random.randint(10, 22))
        burst_len = random.randint(5, 8)
        
        for k in range(burst_len):
            raw_txns.append({
                "timestamp": burst_time + datetime.timedelta(seconds=k * random.randint(30, 90)),
                "sender_id": target_uid,
                "sender_name": u["name"],
                "receiver_id": f"mule_p2p_{random.randint(100, 999)}",
                "receiver_name": f"Unverified Beneficiary {random.randint(10,99)}",
                "receiver_type": "individual",
                "merchant_category": "peer_transfer",
                "amount": round(random.uniform(25000, 95000), 2),
                "currency": "INR",
                "status": "SUCCESS",
                "device_id": f"hacked_dev_{random.randint(1000, 9999)}",
                "device_type": "Android",
                "ip_address": f"45.{random.randint(10,250)}.{random.randint(1,254)}.{random.randint(1,254)}",
                "location_city": random.choice([c for c in CITIES if c != u["city"]]),
                "channel": "UPI_APP",
                "is_fraud_simulated": True,
                "fraud_scenario_tag": "VELOCITY_BURST"
            })

    # Scenario 2: OFF_HOURS_HIGH_VALUE (3 AM high-value luxury/crypto from new device)
    for _ in range(60):
        target_uid = random.choice(list(user_profiles.keys()))
        u = user_profiles[target_uid]
        off_hour_time = start_time + datetime.timedelta(
            days=random.randint(1, 34),
            hours=random.choice([2, 3, 4]),
            minutes=random.randint(10, 50)
        )
        cat = random.choice(["jewelry_luxury", "crypto_p2p_simulation", "electronics"])
        recv_name = random.choice(MERCHANT_CATEGORIES[cat])

        raw_txns.append({
            "timestamp": off_hour_time,
            "sender_id": target_uid,
            "sender_name": u["name"],
            "receiver_id": f"mer_{abs(hash(recv_name)) % 1000:04d}",
            "receiver_name": recv_name,
            "receiver_type": "merchant",
            "merchant_category": cat,
            "amount": round(random.uniform(45000, 99500), 2),
            "currency": "INR",
            "status": "SUCCESS",
            "device_id": f"rogue_dev_{random.randint(1000, 9999)}",
            "device_type": "Web",
            "ip_address": f"185.{random.randint(10,250)}.{random.randint(1,254)}.{random.randint(1,254)}",
            "location_city": random.choice([c for c in CITIES if c != u["city"]]),
            "channel": "PAYMENT_GATEWAY",
            "is_fraud_simulated": True,
            "fraud_scenario_tag": "OFF_HOURS_HIGH_VALUE"
        })

    # Scenario 3: MICRO_PROBE_DRAIN (Small test amount followed by max transfer)
    for _ in range(35):
        target_uid = random.choice(list(user_profiles.keys()))
        u = user_profiles[target_uid]
        probe_base_time = start_time + datetime.timedelta(days=random.randint(2, 33), hours=random.randint(8, 23))
        
        # Probe 1
        raw_txns.append({
            "timestamp": probe_base_time,
            "sender_id": target_uid,
            "sender_name": u["name"],
            "receiver_id": "test_recv_001",
            "receiver_name": "Test Micro Merchant",
            "receiver_type": "merchant",
            "merchant_category": "grocery",
            "amount": round(random.uniform(1.0, 10.0), 2),
            "currency": "INR",
            "status": "SUCCESS",
            "device_id": f"clone_dev_{random.randint(1000, 9999)}",
            "device_type": "Android",
            "ip_address": f"194.{random.randint(10,250)}.{random.randint(1,254)}.{random.randint(1,254)}",
            "location_city": u["city"],
            "channel": "UPI_APP",
            "is_fraud_simulated": True,
            "fraud_scenario_tag": "MICRO_PROBE_DRAIN"
        })
        # Massive drain 45 seconds later
        raw_txns.append({
            "timestamp": probe_base_time + datetime.timedelta(seconds=45),
            "sender_id": target_uid,
            "sender_name": u["name"],
            "receiver_id": f"mule_p2p_{random.randint(100, 999)}",
            "receiver_name": f"Offshore Crypto Gateway {random.randint(1,10)}",
            "receiver_type": "individual",
            "merchant_category": "peer_transfer",
            "amount": round(random.uniform(85000, 99999), 2),
            "currency": "INR",
            "status": "SUCCESS",
            "device_id": f"clone_dev_{random.randint(1000, 9999)}",
            "device_type": "Android",
            "ip_address": f"194.{random.randint(10,250)}.{random.randint(1,254)}.{random.randint(1,254)}",
            "location_city": u["city"],
            "channel": "UPI_APP",
            "is_fraud_simulated": True,
            "fraud_scenario_tag": "MICRO_PROBE_DRAIN"
        })

    # Scenario 4: IMPOSSIBLE_TRAVEL (Sudden physical distance jump within minutes)
    for _ in range(30):
        target_uid = random.choice(list(user_profiles.keys()))
        u = user_profiles[target_uid]
        hop_time = start_time + datetime.timedelta(days=random.randint(3, 33), hours=random.randint(11, 20))
        
        # Valid txn in home city
        raw_txns.append({
            "timestamp": hop_time,
            "sender_id": target_uid,
            "sender_name": u["name"],
            "receiver_id": "mer_coffee_local",
            "receiver_name": "Local Cafe UPI",
            "receiver_type": "merchant",
            "merchant_category": "food_dining",
            "amount": round(random.uniform(150, 450), 2),
            "currency": "INR",
            "status": "SUCCESS",
            "device_id": u["device_id"],
            "device_type": u["device_type"],
            "ip_address": f"103.{random.randint(10,250)}.{random.randint(1,254)}.{random.randint(1,254)}",
            "location_city": u["city"],
            "channel": "QR_CODE",
            "is_fraud_simulated": False,
            "fraud_scenario_tag": "NONE"
        })
        # Fraudulent txn in distant city 8 minutes later
        distant_city = "Kolkata" if u["city"] in ["Mumbai", "Bengaluru", "Pune"] else "Mumbai"
        raw_txns.append({
            "timestamp": hop_time + datetime.timedelta(minutes=8),
            "sender_id": target_uid,
            "sender_name": u["name"],
            "receiver_id": "mer_remote_electronics",
            "receiver_name": "Metro Gadgets Terminal",
            "receiver_type": "merchant",
            "merchant_category": "electronics",
            "amount": round(random.uniform(35000, 75000), 2),
            "currency": "INR",
            "status": "SUCCESS",
            "device_id": f"hijack_dev_{random.randint(100, 999)}",
            "device_type": "Web",
            "ip_address": f"152.{random.randint(10,250)}.{random.randint(1,254)}.{random.randint(1,254)}",
            "location_city": distant_city,
            "channel": "PAYMENT_GATEWAY",
            "is_fraud_simulated": True,
            "fraud_scenario_tag": "IMPOSSIBLE_TRAVEL"
        })

    # Scenario 5: MULE_RECEIVER (Multiple distinct victims funneling funds to 1 receiver in 1 hour)
    mule_receiver_id = "recv_mule_syndicate_01"
    mule_receiver_name = "FastRemit Settlement Services"
    mule_base_time = start_time + datetime.timedelta(days=22, hours=15)
    for idx in range(15):
        victim_uid = f"user_{idx + 50:04d}"
        u = user_profiles.get(victim_uid, user_profiles["user_0001"])
        raw_txns.append({
            "timestamp": mule_base_time + datetime.timedelta(minutes=idx * 4),
            "sender_id": victim_uid,
            "sender_name": u["name"],
            "receiver_id": mule_receiver_id,
            "receiver_name": mule_receiver_name,
            "receiver_type": "individual",
            "merchant_category": "peer_transfer",
            "amount": round(random.uniform(40000, 60000), 2),
            "currency": "INR",
            "status": "SUCCESS",
            "device_id": u["device_id"],
            "device_type": u["device_type"],
            "ip_address": f"103.{random.randint(10,250)}.{random.randint(1,254)}.{random.randint(1,254)}",
            "location_city": u["city"],
            "channel": "UPI_APP",
            "is_fraud_simulated": True,
            "fraud_scenario_tag": "MULE_RECEIVER"
        })

    # Convert to DataFrame
    df = pd.DataFrame(raw_txns)

    # Clean & Sort chronologically (strictly required for preventing data leakage!)
    df = df.sort_values(by="timestamp").reset_index(drop=True)

    # Assign IDs
    df["id"] = [f"TXN_{ts.strftime('%Y%m%d%H%M%S')}_{idx:06d}" for idx, ts in enumerate(df["timestamp"])]

    # 4. Feature Engineering without Data Leakage:
    # Use expanding window per sender strictly prior to the current transaction
    # Group by sender to compute sequential properties
    df["time_since_last_txn_sec"] = 0.0
    df["is_device_changed"] = False
    df["is_location_changed"] = False
    df["rolling_count_1h"] = 1
    df["rolling_amount_1h"] = df["amount"]
    df["rolling_count_24h"] = 1
    df["rolling_amount_24h"] = df["amount"]
    df["user_historical_mean"] = 0.0
    df["user_historical_std"] = 0.0
    df["amount_to_mean_ratio"] = 1.0

    # User state tracking dictionary for fast chronological sequential processing
    user_state = {}
    
    time_since_last_list = []
    dev_changed_list = []
    loc_changed_list = []
    roll_cnt_1h_list = []
    roll_amt_1h_list = []
    roll_cnt_24h_list = []
    roll_amt_24h_list = []
    hist_mean_list = []
    hist_std_list = []
    ratio_list = []

    for row in df.itertuples():
        uid = row.sender_id
        ts = row.timestamp
        amt = row.amount
        dev = row.device_id
        loc = row.location_city

        if uid not in user_state:
            # Baseline from user profile
            prof = user_profiles.get(uid, {"mean_amt": 800.0, "std_amt": 200.0, "city": loc, "device_id": dev})
            user_state[uid] = {
                "last_ts": ts,
                "last_dev": dev,
                "last_loc": loc,
                "history_amts": [amt],
                "recent_txns": [(ts, amt)]
            }
            time_since_last_list.append(86400.0)
            dev_changed_list.append(False)
            loc_changed_list.append(False)
            roll_cnt_1h_list.append(1)
            roll_amt_1h_list.append(amt)
            roll_cnt_24h_list.append(1)
            roll_amt_24h_list.append(amt)
            hist_mean = prof["mean_amt"]
            hist_std = prof["std_amt"]
            hist_mean_list.append(hist_mean)
            hist_std_list.append(hist_std)
            ratio_list.append(round(amt / max(1.0, hist_mean), 2))
        else:
            state = user_state[uid]
            # Time delta
            delta_sec = max(0.0, (ts - state["last_ts"]).total_seconds())
            time_since_last_list.append(delta_sec)

            # Device / Location changes
            is_dev_diff = (dev != state["last_dev"])
            is_loc_diff = (loc != state["last_loc"])
            dev_changed_list.append(is_dev_diff)
            loc_changed_list.append(is_loc_diff)

            # Filter recent txns for 1h and 24h rolling windows
            one_hour_ago = ts - datetime.timedelta(hours=1)
            twenty_four_hours_ago = ts - datetime.timedelta(hours=24)

            # Update recent window
            recent = [(t, a) for (t, a) in state["recent_txns"] if t >= twenty_four_hours_ago]
            recent.append((ts, amt))
            state["recent_txns"] = recent

            # Rolling 1h
            txns_1h = [a for (t, a) in recent if t >= one_hour_ago]
            roll_cnt_1h_list.append(len(txns_1h))
            roll_amt_1h_list.append(round(sum(txns_1h), 2))

            # Rolling 24h
            roll_cnt_24h_list.append(len(recent))
            roll_amt_24h_list.append(round(sum([a for (t, a) in recent]), 2))

            # Historical mean & std strictly using past amounts
            past_amts = state["history_amts"]
            hist_mean = float(np.mean(past_amts))
            hist_std = float(np.std(past_amts)) if len(past_amts) > 1 else (hist_mean * 0.3)
            hist_mean_list.append(round(hist_mean, 2))
            hist_std_list.append(round(max(1.0, hist_std), 2))
            ratio_list.append(round(amt / max(1.0, hist_mean), 2))

            # Update state
            state["last_ts"] = ts
            state["last_dev"] = dev
            state["last_loc"] = loc
            state["history_amts"].append(amt)

    df["time_since_last_txn_sec"] = time_since_last_list
    df["is_device_changed"] = dev_changed_list
    df["is_location_changed"] = loc_changed_list
    df["rolling_count_1h"] = roll_cnt_1h_list
    df["rolling_amount_1h"] = roll_amt_1h_list
    df["rolling_count_24h"] = roll_cnt_24h_list
    df["rolling_amount_24h"] = roll_amt_24h_list
    df["user_historical_mean"] = hist_mean_list
    df["user_historical_std"] = hist_std_list
    df["amount_to_mean_ratio"] = ratio_list

    # Limit to exact total_records requested
    if len(df) > total_records:
        df = df.iloc[:total_records].copy()

    # 5. Data Quality Report
    quality_report = {
        "total_records": len(df),
        "unique_senders": int(df["sender_id"].nunique()),
        "unique_receivers": int(df["receiver_id"].nunique()),
        "duplicate_ids": int(df["id"].duplicated().sum()),
        "null_counts": {k: int(v) for k, v in df.isnull().sum().items() if v > 0},
        "min_amount": float(df["amount"].min()),
        "max_amount": float(df["amount"].max()),
        "avg_amount": round(float(df["amount"].mean()), 2),
        "total_volume_inr": round(float(df["amount"].sum()), 2),
        "simulated_fraud_count": int(df["is_fraud_simulated"].sum()),
        "simulated_fraud_rate_pct": round(float(df["is_fraud_simulated"].mean() * 100), 2),
        "fraud_scenario_breakdown": {
            str(k): int(v) for k, v in df[df["is_fraud_simulated"]]["fraud_scenario_tag"].value_counts().items()
        },
        "start_timestamp": df["timestamp"].min().isoformat(),
        "end_timestamp": df["timestamp"].max().isoformat()
    }

    return df, quality_report
