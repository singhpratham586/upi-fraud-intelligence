import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  Layers, Play, Sliders, CheckCircle2, AlertTriangle, Info,
  TrendingUp, ShieldCheck, Scale, Award, ArrowRight, ShieldAlert,
  DollarSign, Activity
} from 'lucide-react';
import { api } from '../services/api';
import { DetectionRunResponse, ModelMetrics, GovernanceBenchmarksResponse } from '../types';
import { useTheme } from '../context/ThemeContext';

export const DetectionLabPage: React.FC = () => {
  const { theme } = useTheme();
  // Method 1: IQR State
  const [iqrFeature, setIqrFeature] = useState<string>('amount');
  const [iqrMultiplier, setIqrMultiplier] = useState<number>(1.5);

  // Method 2: Isolation Forest State
  const [contamination, setContamination] = useState<number>(0.035);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'amount',
    'rolling_count_1h',
    'rolling_amount_1h',
    'amount_to_mean_ratio',
    'time_since_last_txn_sec',
  ]);

  // Method 3: Time Series State
  const [velocityThreshold, setVelocityThreshold] = useState<number>(4);
  const [amountSigma, setAmountSigma] = useState<number>(3.0);
  const [shortWindowSec, setShortWindowSec] = useState<number>(300);

  // Results State
  const [results, setResults] = useState<DetectionRunResponse | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Governance Benchmark State
  const [activeTab, setActiveTab] = useState<'interactive' | 'governance'>('interactive');
  const [governanceData, setGovernanceData] = useState<GovernanceBenchmarksResponse | null>(null);
  const [loadingGovernance, setLoadingGovernance] = useState(false);

  const fetchGovernance = async () => {
    setLoadingGovernance(true);
    try {
      const data = await api.getGovernanceBenchmarks();
      setGovernanceData(data);
    } catch (err: any) {
      console.error('Failed to load governance benchmarks:', err);
    } finally {
      setLoadingGovernance(false);
    }
  };

  const handleRunModels = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await api.runDetection({
        iqr: { feature: iqrFeature, multiplier: iqrMultiplier },
        iforest: {
          contamination,
          features: selectedFeatures,
          n_estimators: 100,
        },
        timeseries: {
          velocity_count_threshold: velocityThreshold,
          amount_deviation_sigma: amountSigma,
          short_window_seconds: shortWindowSec,
        },
      });
      setResults(res);
    } catch (err: any) {
      setError(err.message || 'Execution error in detection models');
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    handleRunModels();
  }, []);

  const toggleFeature = (feat: string) => {
    if (selectedFeatures.includes(feat)) {
      if (selectedFeatures.length > 1) {
        setSelectedFeatures(selectedFeatures.filter((f) => f !== feat));
      }
    } else {
      setSelectedFeatures([...selectedFeatures, feat]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-taupe/20">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-accent font-bold">
            MODEL BENCHMARKING & ALGORITHMIC LAB
          </span>
          <h1 className="text-3xl font-bold font-editorial text-text-main mt-0.5">
            Detection Lab & Algorithmic Comparison
          </h1>
          <p className="text-xs text-charcoal/80 mt-1">
            Configure, train, and benchmark IQR, Isolation Forest, and Time-Series detectors against separate ground-truth labels.
          </p>
        </div>

        <button
          onClick={handleRunModels}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-semibold text-xs transition-all shadow-soft disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{running ? 'Re-evaluating Models...' : 'Re-Run Detection Engines'}</span>
        </button>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 p-1 bg-surface-subtle rounded-xl border border-taupe/20 w-fit">
        <button
          onClick={() => setActiveTab('interactive')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'interactive'
              ? 'bg-surface text-text-main shadow-soft border border-taupe/20'
              : 'text-taupe hover:text-text-main'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Interactive Hyperparameter Tuner</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('governance');
            if (!governanceData) fetchGovernance();
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'governance'
              ? 'bg-surface text-text-main shadow-soft border border-taupe/20'
              : 'text-taupe hover:text-text-main'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-accent" />
          <span>Model Governance & Multi-Run Sensitivity Matrix</span>
        </button>
      </div>

      {activeTab === 'interactive' ? (
        <>
          {/* Hyperparameter Configuration Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: IQR Tuning */}
        <div className="p-5 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-taupe/15">
            <h3 className="font-bold text-sm text-text-main flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Method 1: IQR Outlier Test
            </h3>
            <span className="text-[10px] font-mono text-taupe">Nonparametric</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-taupe block mb-1">Target Feature:</label>
              <select
                value={iqrFeature}
                onChange={(e) => setIqrFeature(e.target.value)}
                className="w-full p-2 rounded-lg bg-surface-subtle border border-taupe/30 text-charcoal focus:outline-none"
              >
                <option value="amount">Amount (INR)</option>
                <option value="rolling_amount_1h">Rolling 1h Amount</option>
                <option value="amount_to_mean_ratio">Amount-to-Mean Ratio</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-taupe">IQR Multiplier ($k$):</span>
                <span className="font-mono font-bold text-text-main">{iqrMultiplier.toFixed(1)}x IQR</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.5"
                step="0.1"
                value={iqrMultiplier}
                onChange={(e) => setIqrMultiplier(parseFloat(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-taupe font-mono mt-0.5">
                <span>1.0x (Sensitive)</span>
                <span>1.5x (Standard)</span>
                <span>3.0x (Extreme)</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-taupe/20 text-[11px] text-taupe leading-relaxed">
              <strong>Analytical Context:</strong> Univariate IQR bounds identify statistical tail deviations.
              A transaction of ₹45,000 may be an outlier without indicating fraud.
            </div>
          </div>
        </div>

        {/* Card 2: Isolation Forest Tuning */}
        <div className="p-5 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-taupe/15">
            <h3 className="font-bold text-sm text-text-main flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Method 2: Isolation Forest
            </h3>
            <span className="text-[10px] font-mono text-taupe">Scikit-Learn</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-taupe">Assumed Contamination:</span>
                <span className="font-mono font-bold text-text-main">
                  {(contamination * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.10"
                step="0.005"
                value={contamination}
                onChange={(e) => setContamination(parseFloat(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>

            <div>
              <label className="text-taupe block mb-1.5">Feature Space Included:</label>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {[
                  { id: 'amount', label: 'Amount' },
                  { id: 'rolling_count_1h', label: '1h Count' },
                  { id: 'rolling_amount_1h', label: '1h Spend' },
                  { id: 'amount_to_mean_ratio', label: 'Mean Ratio' },
                  { id: 'time_since_last_txn_sec', label: 'Delta Seconds' },
                ].map((f) => (
                  <label
                    key={f.id}
                    className={`flex items-center gap-1.5 p-1.5 rounded cursor-pointer border ${
                      selectedFeatures.includes(f.id)
                        ? 'bg-accent/15 border-accent text-accent-dark font-semibold'
                        : 'bg-surface-subtle border-taupe/20 text-taupe'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(f.id)}
                      onChange={() => toggleFeature(f.id)}
                      className="hidden"
                    />
                    <span>{f.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-taupe/20 text-[11px] text-taupe leading-relaxed">
              <strong>Contamination Note:</strong> Controls the decision threshold for isolation depth.
              Setting this too high inflates false positives; too low risks missed fraud.
            </div>
          </div>
        </div>

        {/* Card 3: Time Series Tuning */}
        <div className="p-5 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-taupe/15">
            <h3 className="font-bold text-sm text-text-main flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Method 3: Time-Series Velocity
            </h3>
            <span className="text-[10px] font-mono text-taupe">Sequential Baseline</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-taupe">1-Hour Velocity Limit:</span>
                <span className="font-mono font-bold text-text-main">&gt; {velocityThreshold} txns/hr</span>
              </div>
              <input
                type="range"
                min="2"
                max="8"
                step="1"
                value={velocityThreshold}
                onChange={(e) => setVelocityThreshold(parseInt(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-taupe">Spending Deviation ($\sigma$):</span>
                <span className="font-mono font-bold text-text-main">+{amountSigma.toFixed(1)}σ</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="5.0"
                step="0.2"
                value={amountSigma}
                onChange={(e) => setAmountSigma(parseFloat(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-taupe">Burst Window (Sec):</span>
                <span className="font-mono font-bold text-text-main">&le; {shortWindowSec}s</span>
              </div>
              <input
                type="range"
                min="60"
                max="600"
                step="30"
                value={shortWindowSec}
                onChange={(e) => setShortWindowSec(parseInt(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-taupe/20 text-[11px] text-taupe leading-relaxed">
              <strong>Data Leakage Prevention:</strong> Rolling stats use strictly historical prior transactions;
              no future windows leak into current scores.
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="p-6 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-taupe/20">
          <div>
            <h3 className="font-bold text-base text-text-main">
              Model Evaluation & Performance Benchmark
            </h3>
            <p className="text-xs text-taupe">
              Evaluated strictly against independently generated synthetic ground truth ($N = 12,423$)
            </p>
          </div>
          <span className="text-[11px] font-mono text-sage bg-sage/15 px-2.5 py-1 rounded font-semibold">
            Independent Ground Truth
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-subtle text-[11px] font-mono uppercase text-taupe border-b border-taupe/20">
                <th className="py-3 px-4">Detection Method</th>
                <th className="py-3 px-4 text-center">Total Alerts</th>
                <th className="py-3 px-4 text-center">True Positives</th>
                <th className="py-3 px-4 text-center">False Positives</th>
                <th className="py-3 px-4 text-center">Precision</th>
                <th className="py-3 px-4 text-center">Recall</th>
                <th className="py-3 px-4 text-center">F1 Score</th>
                <th className="py-3 px-4 text-center">FPR</th>
                <th className="py-3 px-4 text-right">Flagged Exposure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-taupe/15 text-charcoal">
              {results?.model_comparison.map((m, idx) => {
                const isEnsemble = m.model_name.includes('Ensemble');
                return (
                  <tr
                    key={m.model_name}
                    className={isEnsemble ? 'bg-accent/10 font-semibold text-text-main' : 'hover:bg-surface-subtle'}
                  >
                    <td className="py-3.5 px-4 font-medium flex items-center gap-2">
                      {isEnsemble && <span className="w-2 h-2 rounded-full bg-accent" />}
                      <span>{m.model_name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-tabular text-center">{m.total_alerts.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-tabular text-center text-sage font-bold">{m.true_positives}</td>
                    <td className="py-3.5 px-4 font-tabular text-center text-alert">{m.false_positives}</td>
                    <td className="py-3.5 px-4 font-tabular text-center font-bold">{m.precision}%</td>
                    <td className="py-3.5 px-4 font-tabular text-center font-bold">{m.recall}%</td>
                    <td className="py-3.5 px-4 font-tabular text-center font-bold text-accent-dark">{m.f1_score}%</td>
                    <td className="py-3.5 px-4 font-tabular text-center text-taupe">{m.false_positive_rate}%</td>
                    <td className="py-3.5 px-4 font-tabular text-right font-bold">
                      ₹{m.flagged_amount_sum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 2: Score Distribution Histogram */}
      {results?.score_distribution && (
        <div className="p-6 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-text-main">
                Ensemble Anomaly Score Distribution (0 - 100)
              </h3>
              <p className="text-xs text-taupe">
                Histogram showing separation between legitimate volume and simulated fraud
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-charcoal">
                <span className="w-3 h-3 rounded bg-charcoal" /> Legitimate Volume
              </span>
              <span className="flex items-center gap-1.5 text-alert">
                <span className="w-3 h-3 rounded bg-alert" /> Simulated Fraud
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results.score_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#2A2622' : '#A99B89'} opacity={0.25} />
                <XAxis dataKey="bin_range" tick={{ fontSize: 10, fill: theme === 'dark' ? '#A6998A' : '#706456' }} label={{ value: 'Risk Score Bin', position: 'insideBottom', offset: -5, fontSize: 10, fill: theme === 'dark' ? '#A6998A' : '#706456' }} />
                <YAxis tick={{ fontSize: 10, fill: theme === 'dark' ? '#A6998A' : '#706456' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#181614' : '#FFF9F0',
                    borderColor: theme === 'dark' ? '#38322B' : '#A99B89',
                    color: theme === 'dark' ? '#F7F2EB' : '#171512',
                    borderRadius: '8px',
                    fontSize: '11px',
                    boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.3)',
                  }}
                />
                <Bar dataKey="count" name="Total Evaluated" fill={theme === 'dark' ? '#E3D9CC' : '#292520'} radius={[4, 4, 0, 0]} />
                <Bar dataKey="fraud_simulated_count" name="Simulated Fraud Ground Truth" fill="#E55B49" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  ) : (
    /* Governance Sensitivity & Policy Benchmarks View */
    <div className="space-y-6">
      {/* Strategic Recommendation Callout */}
      {governanceData && (
        <div className="p-6 rounded-2xl bg-accent/10 border border-accent/30 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-accent text-white uppercase tracking-wider">
                Optimal Operating Point
              </span>
              <span className="text-xs font-bold text-text-main">
                {governanceData.optimal_policy}
              </span>
            </div>
            <p className="text-xs text-charcoal/90 leading-relaxed max-w-3xl">
              {governanceData.strategic_guidance}
            </p>
          </div>

          <button
            onClick={fetchGovernance}
            disabled={loadingGovernance}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-dark transition-colors shrink-0 shadow-soft disabled:opacity-50"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{loadingGovernance ? 'Evaluating...' : 'Refresh Benchmark Run'}</span>
          </button>
        </div>
      )}

      {/* 3 Policy Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {governanceData?.policies.map((p) => {
          const isOptimal = p.policy_name.includes('Balanced') || p.policy_key === 'balanced';
          return (
            <div
              key={p.policy_key}
              className={`p-5 rounded-2xl bg-surface border transition-all flex flex-col justify-between shadow-soft ${
                isOptimal
                  ? 'border-accent ring-2 ring-accent/20'
                  : 'border-taupe/20'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-taupe/15">
                  <h3 className="text-sm font-bold text-text-main flex items-center gap-1.5">
                    {isOptimal && <Award className="w-4 h-4 text-accent" />}
                    <span>{p.policy_name.split('(')[0].trim()}</span>
                  </h3>
                  {isOptimal && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/15 text-accent-dark font-mono">
                      RECOMMENDED
                    </span>
                  )}
                </div>

                <p className="text-xs text-taupe leading-relaxed">
                  {p.description}
                </p>

                {/* Hyperparameters Pill */}
                <div className="p-2.5 rounded-xl bg-surface-subtle border border-taupe/15 space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-taupe">
                    <span>IQR Envelope:</span>
                    <span className="font-bold text-charcoal">{p.iqr_multiplier}x IQR</span>
                  </div>
                  <div className="flex justify-between text-taupe">
                    <span>iForest Contam:</span>
                    <span className="font-bold text-charcoal">{(p.iforest_contamination * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-taupe">
                    <span>Velocity Thresh:</span>
                    <span className="font-bold text-charcoal">{p.velocity_threshold} txns/hr</span>
                  </div>
                </div>

                {/* Performance Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-2 rounded-lg bg-surface-subtle border border-taupe/15">
                    <span className="text-[10px] text-taupe block">Precision</span>
                    <span className="font-tabular font-bold text-sm text-text-main">{p.precision}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-subtle border border-taupe/15">
                    <span className="text-[10px] text-taupe block">Recall</span>
                    <span className="font-tabular font-bold text-sm text-text-main">{p.recall}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-subtle border border-taupe/15">
                    <span className="text-[10px] text-taupe block">Total Alerts</span>
                    <span className="font-tabular font-bold text-sm text-charcoal">{p.total_alerts.toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-subtle border border-taupe/15">
                    <span className="text-[10px] text-taupe block">False Positives</span>
                    <span className="font-tabular font-bold text-sm text-alert">{p.false_positives}</span>
                  </div>
                </div>
              </div>

              {/* Business Value Footer */}
              <div className="pt-4 mt-4 border-t border-taupe/15 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-taupe">Net Business Value:</span>
                  <span className="font-tabular font-bold text-sm text-sage">
                    ₹{p.net_business_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-[10px] text-taupe italic">
                  {p.suitability}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-Run Sensitivity Benchmark Matrix Table */}
      <div className="p-6 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-taupe/20">
          <div>
            <h3 className="font-bold text-base text-text-main">
              Operational Operating Points & Sensitivity Matrix
            </h3>
            <p className="text-xs text-taupe">
              Side-by-side comparison of review workload, false alarms, and net business value across 12,423 transactions
            </p>
          </div>
          <span className="text-[11px] font-mono text-taupe">
            Ground-Truth Simulated Fraud: {governanceData?.simulated_fraud_count} cases (₹{governanceData?.total_fraud_volume.toLocaleString('en-IN')})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-subtle text-[11px] font-mono uppercase text-taupe border-b border-taupe/20">
                <th className="py-3 px-4">Policy Regime</th>
                <th className="py-3 px-3 text-center">Triage Alerts</th>
                <th className="py-3 px-3 text-center">True Positives</th>
                <th className="py-3 px-3 text-center">False Alarms</th>
                <th className="py-3 px-3 text-center">Precision</th>
                <th className="py-3 px-3 text-center">Recall</th>
                <th className="py-3 px-3 text-center">F1 Score</th>
                <th className="py-3 px-3 text-right">Recovered Exposure</th>
                <th className="py-3 px-3 text-right">Review Cost (₹150/alert)</th>
                <th className="py-3 px-4 text-right">Net Business ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-taupe/15 text-charcoal">
              {governanceData?.policies.map((p) => {
                const isOptimal = p.policy_name.includes('Balanced') || p.policy_key === 'balanced';
                return (
                  <tr
                    key={p.policy_key}
                    className={isOptimal ? 'bg-accent/10 font-semibold text-text-main' : 'hover:bg-surface-subtle'}
                  >
                    <td className="py-3.5 px-4 font-medium flex items-center gap-2">
                      {isOptimal && <span className="w-2 h-2 rounded-full bg-accent" />}
                      <span>{p.policy_name}</span>
                    </td>
                    <td className="py-3.5 px-3 font-tabular text-center">{p.total_alerts.toLocaleString()}</td>
                    <td className="py-3.5 px-3 font-tabular text-center text-sage font-bold">{p.true_positives}</td>
                    <td className="py-3.5 px-3 font-tabular text-center text-alert">{p.false_positives}</td>
                    <td className="py-3.5 px-3 font-tabular text-center font-bold">{p.precision}%</td>
                    <td className="py-3.5 px-3 font-tabular text-center font-bold">{p.recall}%</td>
                    <td className="py-3.5 px-3 font-tabular text-center font-bold text-accent-dark">{p.f1_score}%</td>
                    <td className="py-3.5 px-3 font-tabular text-right text-sage font-bold">
                      ₹{p.estimated_fraud_prevented.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 font-tabular text-right text-alert">
                      ₹{p.estimated_investigation_cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-tabular text-right font-bold text-accent-dark">
                      ₹{p.net_business_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}
    </div>
  );
};
