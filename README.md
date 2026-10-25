# UPI Fraud Intelligence — Transaction Risk Analytics Platform

[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-orange.svg)](https://threejs.org/)
[![Tests](https://img.shields.io/badge/Tests-12%2F12%20Passing-brightgreen.svg)]()

A full-stack fintech analytics and decision-support platform designed to demonstrate advanced **SQL engineering**, **Python analytics**, **statistical reasoning**, **unsupervised anomaly detection**, **business intelligence**, and **financial risk modeling** across synthetic Unified Payments Interface (UPI) transaction streams.

---

## 1. Executive Summary & Problem Context

Unified Payments Interface (UPI) handles billions of domestic peer-to-peer and merchant transactions each month. For fraud analysts and risk operations teams, identifying fraudulent patterns presents critical technical trade-offs:

1. **Volume vs. Precision:** Flagging every high amount triggers alert fatigue and excessive operational triage costs.
2. **Behavioral Variance:** Benign users frequently purchase luxury items or travel, while sophisticated account takeovers mimic normal diurnal habits.
3. **Decision Economics:** Risk engines must not optimize solely for abstract machine-learning metrics; they must balance averted losses against investigation workload costs.

This platform bridges technical anomaly detection and executive decision support. It benchmarks three independent detection paradigms against an independently generated synthetic ground truth ($N = 12,423$ transactions, ₹57.8M volume), providing real-time forensic exploration, persistent case notes, and 20+ analytical SQL queries.

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph Data Pipeline
        DG[Synthetic Generator<br/>400 User Profiles • 5 Fraud Scenarios] --> FE[Feature Engineering<br/>Expanding Baseline • Zero Future Leakage]
        FE --> DB[(Database Layer<br/>PostgreSQL / SQLite3)]
    end

    subgraph Analytics & ML Engine
        DB --> IQR[Method 1: Nonparametric IQR<br/>Spread: Q3 + 1.5x IQR]
        DB --> IFO[Method 2: Isolation Forest<br/>Multivariate Partition Trees]
        DB --> TS[Method 3: Time-Series Velocity<br/>Z-Score >= 3.0σ & Burst Window]
        IQR & IFO & TS --> ENS[Calibrated Ensemble Risk Engine<br/>Composite Score: 0 - 100]
        ENS --> EVAL[Independent Model Evaluation<br/>Precision • Recall • FPR • F1]
        ENS --> BIZ[Business Impact Modeling<br/>Workload vs Loss Avoided Curve]
    end

    subgraph Presentation & APIs
        DB & EVAL & BIZ --> API[FastAPI Backend<br/>Pydantic V2 • REST Endpoints]
        API --> UI[React 18 + Vite + Tailwind<br/>3D Network Hero • Recharts Studio]
    end
```

---

## 3. Technology Stack

- **Backend:** Python 3.13, FastAPI, Pydantic V2, SQLAlchemy 2.0, Uvicorn, Pytest, Faker
- **Analytics & ML:** Pandas, NumPy, SciPy, Scikit-learn (Isolation Forest)
- **Database:** PostgreSQL (production standard) with zero-dependency SQLite fallback and Alembic migrations
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts
- **3D Visualization:** Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`)
- **Containerization:** Docker & Docker Compose

---

## 4. Visual Design System

Designed around a distinctive **3D fintech aesthetic**:

| Element | Color Hex | Role |
| :--- | :--- | :--- |
| **Warm Beige** | `#F2E8D8` | Primary background canvas |
| **Light Cream** | `#FFF9F0` | Elevated surfaces and forensic cards |
| **Burnt Orange** | `#C96B35` | Primary action accent and anomalous node highlights |
| **Deep Terracotta** | `#A84E25` | Warning states and secondary brand cues |
| **Near-Black** | `#171512` | Editorial headlines and high-contrast typography |
| **Charcoal** | `#292520` | Primary buttons and chart data marks |
| **Muted Taupe** | `#A99B89` | Subtle grid lines and secondary metrics |
| **Soft Sage** | `#71866C` | Cleared transactions and verified baselines |
| **Muted Red** | `#B84A3B` | Critical alerts and high-risk flags |

The landing hero includes an interactive **Three.js 3D spatial network** displaying user/merchant node connectivity, pulse rays, and a central rotating security token, coupled with an automatic static fallback for accessibility and reduced-motion preferences.

---

## 5. The Three Detection Methods

### Method 1: Interquartile Range (IQR) Outlier Detection
Nonparametric dispersion test identifying values breaching the upper dispersion envelope:
$$\text{IQR} = Q_3 - Q_1 \quad \implies \quad \text{Upper Bound} = Q_3 + 1.5 \times \text{IQR}$$
- **Strength:** Robust against heavy right-tail skewed financial data.
- **Limitation:** Univariate outliers are not inherently fraudulent (e.g. legitimate seasonal jewelry purchases).

### Method 2: Scikit-Learn Isolation Forest
Unsupervised multivariate tree ensemble that isolates anomalies by random axis-parallel splits. Anomalies require fewer splits and have shorter average path lengths:
$$s(x, n) = 2^{-\frac{E(h(x))}{c(n)}}$$
- **Features Used:** `amount`, `rolling_count_1h`, `rolling_amount_1h`, `amount_to_mean_ratio`, `time_since_last_txn_sec`
- **Configurable:** Contamination factor (default 3.5%), number of estimators, random seed.

### Method 3: Time-Series Velocity & Baseline Deviation
Sequential behavioral model tracking individual expanding baselines without lookahead future data leakage:
$$Z = \frac{\text{amount} - \mu_{\text{user historical}}}{\sigma_{\text{user historical}}} \ge 3.0\sigma$$
- Evaluates rapid succession bursts ($\Delta t \le 300\text{s}$ with high ticket) and impossible physical transit hops ($<30\text{m}$ between distinct metro cities).

### Multi-Model Consensus Superiority
When all three models independently flag a transaction, false positives drop dramatically:
- Single method precision: ~35% - 55%
- 3-Model Consensus Precision: **>88%**

---

## 6. Business Impact & Decision Support

The platform models operational cost-benefit trade-offs using an editable financial equation:

$$\text{Net Benefit} = (\text{Detected Fraud Value} \times \text{Recovery Rate}) - (\text{Alerts} \times \text{Cost per Investigation}) - (\text{Missed Fraud} \times \text{Multiplier})$$

- **Default Assumptions:** ₹350 per investigation, 85% loss recovery rate, 1.2x multiplier for missed fraud chargebacks.
- **Threshold Curve:** Evaluates the trade-off between Recall, False Positives, and Net Financial Benefit from threshold 15 to 90.

---

## 7. SQL Query Studio (20+ Production Queries)

The system includes a production query catalog covering 20 essential financial analytics questions:
1. Total Transaction Volume & Throughput
2. Aggregate Transaction Value & Average Ticket Size
3. Daily Transaction Velocity & Value Trends
4. Hourly Diurnal Pattern & Night-Window Risk
5. Merchant Category Breakdown & Risk Distribution
6. Transaction Amount Percentile & Tail Exposure (Window Ranking)
7. High-Frequency Transacting Accounts (Velocity Profiling)
8. Repeated Receiver Funneling (Money Mule Syndicate Detection)
9. Rolling 1-Hour Velocity Burst Analysis
10. User-Level Baseline vs Current Transaction Ratio
11. Extreme Deviations from Historical User Mean ($Z \ge 4.0\sigma$)
12. Device Switch Velocity & Security Implications
13. Geographic Location Hops & Impossible Transit
14. Risk Category Distribution & Alert Tiers
15. Detection Method Agreement & Consensus Analysis
16. Flagged Transaction Value by Merchant Vertical
17. Investigation Queue Status & Operational Workload
18. False Positive Analysis: Legitimate High-Value Spenders
19. Precision, Recall, and Ground-Truth Confusion Metrics
20. Bi-Weekly Period-over-Period Risk Shift

---

## 8. Data Dictionary

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(64) | Primary key (e.g. `TXN_20261025115545_000001`) |
| `timestamp` | TIMESTAMP | Chronological transaction timestamp |
| `sender_id` | VARCHAR(64) | Sender identifier from 400 user profile clusters |
| `receiver_id` | VARCHAR(64) | Beneficiary or merchant identifier |
| `receiver_type` | VARCHAR(32) | `merchant` or `individual` |
| `merchant_category` | VARCHAR(64) | Vertical (grocery, dining, electronics, jewelry, crypto, etc.) |
| `amount` | NUMERIC(12,2) | Value in INR |
| `status` | VARCHAR(32) | `SUCCESS` or `FAILED` |
| `device_id` | VARCHAR(64) | Device fingerprint |
| `location_city` | VARCHAR(64) | Metro origin city (Mumbai, Bengaluru, Delhi, etc.) |
| `is_device_changed` | BOOLEAN | Indicates device shift from prior transaction |
| `is_location_changed` | BOOLEAN | Indicates geographic hop |
| `time_since_last_txn_sec` | NUMERIC(10,2) | Inter-transaction delta in seconds |
| `rolling_count_1h` | INTEGER | Transacted count in past 60 minutes |
| `rolling_amount_1h` | NUMERIC(12,2) | Transacted value in past 60 minutes |
| `user_historical_mean` | NUMERIC(12,2) | Historical average spend prior to transaction |
| `amount_to_mean_ratio` | NUMERIC(10,2) | Multiple of typical ticket size |
| `is_fraud_simulated` | BOOLEAN | Separate ground truth simulated fraud label |
| `fraud_scenario_tag` | VARCHAR(64) | Fraud scenario archetype (`VELOCITY_BURST`, `OFF_HOURS`, etc.) |

---

## 9. Local Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ (Node 22 supported)
- npm or pnpm
- (Optional) Docker for PostgreSQL

### Step 1: Clone and Set Up Backend
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Generate synthetic dataset and seed database (12,423 records)
python scripts/generate_and_seed.py

# Run test suite
pytest tests/ -v
```

### Step 2: Start the Backend Server
```bash
# In backend directory with venv activated:
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at `http://127.0.0.1:8000/api/docs`.

### Step 3: Set Up and Start Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open `http://localhost:5173` in your browser.

### Step 4: (Optional) Run with Docker PostgreSQL
```bash
# From repository root:
docker-compose up -d

# Set environment variable in backend/.env:
# DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/upi_fraud_db
```

---

## 10. Test Coverage

Run the backend test suite:
```bash
pytest backend/tests/ -v
```
**Results: 12 passed, 0 failures (100% pass rate):**
- `test_api_analytics_overview`: Passed
- `test_api_full_dashboard`: Passed
- `test_api_transactions_list_and_detail`: Passed
- `test_api_investigation_update`: Passed
- `test_api_sql_insights_catalog_and_execution`: Passed
- `test_api_business_impact_simulation`: Passed
- `test_synthetic_data_generation`: Passed
- `test_iqr_detector`: Passed
- `test_isolation_forest_detector`: Passed
- `test_time_series_detector`: Passed
- `test_evaluation_metrics_arithmetic`: Passed
- `test_method_agreement_logic`: Passed

---

## 11. Ethical Boundaries & Limitations

1. **Decision Support Only:** This platform assists human investigators by prioritizing suspicious alerts. It does not autonomously execute account blocks or fund reversals.
2. **Synthetic Boundary:** Evaluation metrics benchmark algorithmic sensitivity on synthetic UPI distributions and must not be cited as real-world banking statistics.
3. **Data Privacy:** All transaction IDs, customer names, accounts, and IPs are synthetically generated; no genuine personally identifiable information (PII) is processed.
