import React from 'react';
import {
  BookOpen, ShieldCheck, Database, Layers, TrendingUp, AlertTriangle,
  Code2, CheckCircle2, Lock, GitBranch
} from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  const dataDictionary = [
    { field: 'id', type: 'VARCHAR(64)', desc: 'Unique alphanumeric transaction identifier (TXN_YYYYMMDDHHMMSS_XXXXXX)' },
    { field: 'timestamp', type: 'TIMESTAMP', desc: 'Chronologically ordered UTC transaction timestamp' },
    { field: 'sender_id', type: 'VARCHAR(64)', desc: 'Synthetic user identifier from 400 user profile clusters' },
    { field: 'receiver_id', type: 'VARCHAR(64)', desc: 'Receiver account token (merchant or peer individual)' },
    { field: 'receiver_type', type: 'VARCHAR(32)', desc: 'Categorical type: merchant or individual' },
    { field: 'merchant_category', type: 'VARCHAR(64)', desc: 'Category: grocery, food_dining, utilities, electronics, jewelry, crypto, etc.' },
    { field: 'amount', type: 'NUMERIC(12,2)', desc: 'Transaction value in Indian Rupees (INR)' },
    { field: 'is_device_changed', type: 'BOOLEAN', desc: 'True if device fingerprint differs from sender prior transaction' },
    { field: 'is_location_changed', type: 'BOOLEAN', desc: 'True if transaction IP city differs from sender baseline city' },
    { field: 'time_since_last_txn_sec', type: 'NUMERIC(10,2)', desc: 'Inter-arrival seconds since previous transaction by same sender' },
    { field: 'rolling_count_1h', type: 'INTEGER', desc: 'Transactions executed by sender in past 60-minute window' },
    { field: 'rolling_amount_1h', type: 'NUMERIC(12,2)', desc: 'Cumulative spending by sender in past 60-minute window' },
    { field: 'user_historical_mean', type: 'NUMERIC(12,2)', desc: 'Expanding average ticket of sender strictly prior to this transaction' },
    { field: 'amount_to_mean_ratio', type: 'NUMERIC(10,2)', desc: 'Ratio of current amount to historical personal baseline' },
    { field: 'is_fraud_simulated', type: 'BOOLEAN', desc: 'Separated ground-truth simulated label (never shared with detector training)' },
    { field: 'fraud_scenario_tag', type: 'VARCHAR(64)', desc: 'Scenario archetype: VELOCITY_BURST, OFF_HOURS, MICRO_PROBE, etc.' },
  ];

  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2 pb-6 border-b border-taupe/20">
        <span className="text-xs font-mono uppercase tracking-wider text-accent font-bold">
          DOCUMENTATION & METHODOLOGICAL RIGOR
        </span>
        <h1 className="text-4xl font-bold font-editorial text-text-main">
          Project Methodology & Data Architecture
        </h1>
        <p className="text-sm text-charcoal/80 leading-relaxed">
          Comprehensive documentation detailing synthetic generation, feature engineering without data leakage,
          anomaly detection mechanics, and responsible analytical boundaries.
        </p>
      </div>

      {/* 1. Synthetic Data Generation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-text-main font-editorial flex items-center gap-2">
          <Database className="w-5 h-5 text-accent" />
          1. Synthetic Data Generation & User Personas
        </h2>
        <div className="p-5 rounded-2xl bg-surface border border-taupe/20 space-y-3 text-xs text-charcoal/80 leading-relaxed shadow-soft">
          <p>
            The dataset comprises <strong>12,423 synthetic UPI transactions</strong> spanning a continuous 35-day period,
            seeded with reproducible random states (seed = 42). To avoid naive random numbers, the platform models
            heterogeneous user behavioral clusters:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-charcoal">
            <li><strong>Regular Spenders (60%):</strong> Moderate daily amounts (₹300 - ₹1,500), groceries, dining, utility bills.</li>
            <li><strong>High-Net-Worth & Business (12%):</strong> Higher ticket sizes (₹4,000 - ₹15,000), electronics, luxury, travel.</li>
            <li><strong>Student / Modest (18%):</strong> Low ticket sizes (₹50 - ₹400), micro-merchants, gaming, food delivery.</li>
            <li><strong>Frequent Merchants (10%):</strong> Sustained multi-transaction velocity across working hours.</li>
          </ul>
          <p>
            A diurnal circadian curve models real domestic UPI commerce: transaction frequency peaks during lunch
            (12:00-14:00) and evening hours (19:00-22:00), dropping to near zero between 01:00 and 05:00.
          </p>
        </div>
      </section>

      {/* 2. Fraud Scenarios */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-text-main font-editorial flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent" />
          2. Independent Ground-Truth Fraud Scenarios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-surface border border-taupe/20 space-y-1.5 shadow-soft">
            <span className="font-mono text-accent font-bold">Scenario 1: VELOCITY_BURST</span>
            <p className="text-charcoal/80">
              Compromised account executes 5 to 8 high-ticket transfers (₹25,000 - ₹95,000) within 15 minutes to unfamiliar peer beneficiaries.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-taupe/20 space-y-1.5 shadow-soft">
            <span className="font-mono text-accent font-bold">Scenario 2: OFF_HOURS_HIGH_VALUE</span>
            <p className="text-charcoal/80">
              Uncharacteristic transfer at 03:15 AM from an unknown device in an unvisited city targeting luxury jewelry or crypto P2P.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-taupe/20 space-y-1.5 shadow-soft">
            <span className="font-mono text-accent font-bold">Scenario 3: MICRO_PROBE_DRAIN</span>
            <p className="text-charcoal/80">
              Two small probe authorizations (₹1 - ₹10) to verify account balance, followed 45 seconds later by a maximum UPI transfer (₹90,000+).
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-taupe/20 space-y-1.5 shadow-soft">
            <span className="font-mono text-accent font-bold">Scenario 4: IMPOSSIBLE_TRAVEL</span>
            <p className="text-charcoal/80">
              A legitimate transaction in Chennai followed 8 minutes later by an authorization from a Delhi IP address, violating physical travel constraints.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Feature Engineering without Leakage */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-text-main font-editorial flex items-center gap-2">
          <Lock className="w-5 h-5 text-accent" />
          3. Feature Engineering & Strict Data Leakage Prevention
        </h2>
        <div className="p-5 rounded-2xl bg-surface border border-taupe/20 space-y-3 text-xs text-charcoal/80 leading-relaxed shadow-soft">
          <p>
            A common error in transaction risk engineering is calculating statistics (such as user average spend or global percentiles)
            using future transactions, which invalidates model evaluation.
          </p>
          <div className="p-3.5 rounded-xl bg-background border border-taupe/20 font-mono text-[11px] text-charcoal space-y-1">
            <p className="text-sage font-semibold">✓ Chronological Sorting Guarantee:</p>
            <p>Transactions are strictly sorted by timestamp prior to feature derivation.</p>
            <p className="text-sage font-semibold mt-2">✓ Expanding Past Window:</p>
            <p>μ_user(t) = (1/k) * Σ amount_i (where t_i &lt; t)</p>
            <p className="text-sage font-semibold mt-2">✓ Rolling State Caching:</p>
            <p>Rolling 1-hour and 24-hour windows discard timestamps outside the elapsed boundary.</p>
          </div>
        </div>
      </section>

      {/* 4. Three Anomaly Detection Methods */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-text-main font-editorial flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent" />
          4. Mathematical Detection Frameworks
        </h2>
        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl bg-surface border border-taupe/20 space-y-1 shadow-soft">
            <h4 className="font-bold text-text-main">Method 1: Interquartile Range (IQR)</h4>
            <p className="text-charcoal/80">
              Univariate dispersion metric robust against heavy right tails. Computes $IQR = Q_3 - Q_1$, flagging amounts exceeding $Q_3 + 1.5 \times IQR$.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-taupe/20 space-y-1 shadow-soft">
            <h4 className="font-bold text-text-main">Method 2: Multi-Feature Isolation Forest</h4>
            <p className="text-charcoal/80">
              Unsupervised tree ensemble recursively partitioning feature space. Anomalies are isolated near root nodes with shorter path lengths $E(h(x))$.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-taupe/20 space-y-1 shadow-soft">
            <h4 className="font-bold text-text-main">Method 3: Time-Series & Personal Baseline Deviation</h4>
            <p className="text-charcoal/80">
              Computes personalized Z-scores Z = (amount - μ_hist) / σ_hist ≥ 3.0σ alongside rolling 1-hour burst velocity limits.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Data Dictionary Table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-text-main font-editorial flex items-center gap-2">
          <Database className="w-5 h-5 text-accent" />
          5. PostgreSQL Data Dictionary
        </h2>
        <div className="rounded-xl border border-taupe/20 overflow-hidden shadow-soft bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface-subtle font-mono text-[11px] text-taupe uppercase border-b border-taupe/20">
                <tr>
                  <th className="py-2.5 px-3">Column Name</th>
                  <th className="py-2.5 px-3">Data Type</th>
                  <th className="py-2.5 px-3">Description & Behavioral Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-taupe/15 text-charcoal">
                {dataDictionary.map((col) => (
                  <tr key={col.field} className="hover:bg-surface-subtle/50">
                    <td className="py-2 px-3 font-mono font-semibold text-text-main">{col.field}</td>
                    <td className="py-2 px-3 font-mono text-accent text-[11px]">{col.type}</td>
                    <td className="py-2 px-3 text-taupe">{col.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. Limitations & Responsible Analytics */}
      <section className="p-6 rounded-2xl bg-surface border border-taupe/20 space-y-3 text-xs leading-relaxed shadow-soft">
        <div className="flex items-center gap-2 text-accent font-bold text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Model Limitations & Ethical Safeguards</span>
        </div>
        <p className="text-charcoal/80">
          This system is an analyst decision-support platform designed to surface high-priority anomalies for human review.
          It must never autonomously block transactions, seize funds, or make final determinations of illegality without
          human investigator oversight. Synthetic performance figures serve solely as an algorithmic portfolio demonstration.
        </p>
      </section>
    </div>
  );
};
