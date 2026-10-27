import React, { useState, useEffect } from 'react';
import {
  Sliders, Play, RotateCcw, AlertTriangle, ShieldCheck,
  TrendingUp, Activity, Sparkles, CheckCircle2, Info, ArrowRight,
  Zap, ShieldAlert, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';
import { api } from '../services/api';
import type { WhatIfResponse, DetectorOutput, FeatureAttribution } from '../types';

export const WhatIfPlaygroundPage: React.FC = () => {
  // Input parameters
  const [amount, setAmount] = useState<number>(45000);
  const [deltaSec, setDeltaSec] = useState<number>(120);
  const [rollingCount, setRollingCount] = useState<number>(5);
  const [category, setCategory] = useState<string>('crypto_p2p_simulation');
  const [deviceChanged, setDeviceChanged] = useState<boolean>(true);
  const [locationChanged, setLocationChanged] = useState<boolean>(true);
  const [userMean, setUserMean] = useState<number>(2500);
  const [userStd, setUserStd] = useState<number>(800);

  // Result state
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.simulateWhatIf({
        amount,
        time_since_last_txn_sec: deltaSec,
        rolling_count_1h: rollingCount,
        merchant_category: category,
        is_device_changed: deviceChanged,
        is_location_changed: locationChanged,
        user_historical_mean: userMean,
        user_historical_std: userStd,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [amount, deltaSec, rollingCount, category, deviceChanged, locationChanged, userMean, userStd]);

  const loadNormalPreset = () => {
    setAmount(450);
    setDeltaSec(3600);
    setRollingCount(1);
    setCategory('grocery');
    setDeviceChanged(false);
    setLocationChanged(false);
    setUserMean(800);
    setUserStd(250);
  };

  const loadVelocityBurstPreset = () => {
    setAmount(78500);
    setDeltaSec(90);
    setRollingCount(6);
    setCategory('crypto_p2p_simulation');
    setDeviceChanged(true);
    setLocationChanged(true);
    setUserMean(1800);
    setUserStd(600);
  };

  const loadHighNetWorthPreset = () => {
    setAmount(95000);
    setDeltaSec(7200);
    setRollingCount(1);
    setCategory('jewelry_luxury');
    setDeviceChanged(false);
    setLocationChanged(false);
    setUserMean(85000);
    setUserStd(15000);
  };

  const modified = result?.modified;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-taupe/20">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-accent font-bold flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            WHAT-IF DETECTION PLAYGROUND
          </span>
          <h1 className="text-3xl font-bold font-editorial text-text-main mt-0.5">
            Realtime Anomaly Parameter Simulator
          </h1>
          <p className="text-xs text-charcoal/80 mt-1">
            Safely manipulate transaction parameters to test model sensitivity, signal boundaries, and feature attribution.
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadNormalPreset}
            className="px-3 py-1.5 rounded-xl bg-surface border border-taupe/20 text-xs font-medium text-charcoal hover:border-accent shadow-soft transition-colors"
          >
            Baseline Normal
          </button>
          <button
            onClick={loadVelocityBurstPreset}
            className="px-3 py-1.5 rounded-xl bg-alert-red/15 border border-alert-red/30 text-xs font-medium text-alert-red hover:bg-alert-red hover:text-white shadow-soft transition-colors"
          >
            Velocity Burst Fraud
          </button>
          <button
            onClick={loadHighNetWorthPreset}
            className="px-3 py-1.5 rounded-xl bg-accent/15 border border-accent/30 text-xs font-medium text-accent hover:bg-accent hover:text-white shadow-soft transition-colors"
          >
            High-Net-Worth Spender
          </button>
        </div>
      </div>

      {/* Main Grid: Controls Left, Simulation Output Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="p-6 rounded-2xl bg-surface border border-taupe/25 shadow-soft space-y-5">
          <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" />
            Hypothetical Feature Inputs
          </h3>

          {/* Amount Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-charcoal">Transaction Amount (INR)</label>
              <span className="font-mono font-bold text-accent">₹{amount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="100"
              max="100000"
              step="500"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-taupe">
              <span>₹100</span>
              <span>₹50,000</span>
              <span>₹100,000</span>
            </div>
          </div>

          {/* Time Pacing Delta Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-charcoal">Inter-Transaction Pacing</label>
              <span className="font-mono font-bold text-text-main">{deltaSec}s ({Math.round(deltaSec / 60)}m)</span>
            </div>
            <input
              type="range"
              min="10"
              max="3600"
              step="30"
              value={deltaSec}
              onChange={(e) => setDeltaSec(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-taupe">
              <span>10s (Rapid)</span>
              <span>15m</span>
              <span>60m (Normal)</span>
            </div>
          </div>

          {/* Rolling Count 1h */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-charcoal">Rolling 1-Hour Count</label>
              <span className="font-mono font-bold text-text-main">{rollingCount} transfers</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="1"
              value={rollingCount}
              onChange={(e) => setRollingCount(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-charcoal block">Merchant Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs p-2 rounded-xl bg-background border border-taupe/25 text-text-main focus:outline-none focus:border-accent"
            >
              <option value="grocery">Grocery (Retail Everyday)</option>
              <option value="food_dining">Food & Dining</option>
              <option value="electronics">Electronics</option>
              <option value="jewelry_luxury">Jewelry & Luxury (High Exposure)</option>
              <option value="crypto_p2p_simulation">Crypto P2P Sim (High Volatility)</option>
              <option value="travel_booking">Travel Booking</option>
              <option value="peer_transfer">Peer-to-Peer Transfer</option>
            </select>
          </div>

          {/* Switches: Device & Location Hopped */}
          <div className="space-y-2 pt-2 border-t border-taupe/15">
            <label className="flex items-center justify-between text-xs text-charcoal cursor-pointer select-none">
              <span>New Hardware Fingerprint</span>
              <input
                type="checkbox"
                checked={deviceChanged}
                onChange={(e) => setDeviceChanged(e.target.checked)}
                className="rounded border-taupe/30 text-accent focus:ring-accent"
              />
            </label>
            <label className="flex items-center justify-between text-xs text-charcoal cursor-pointer select-none">
              <span>Geographic City Hop</span>
              <input
                type="checkbox"
                checked={locationChanged}
                onChange={(e) => setLocationChanged(e.target.checked)}
                className="rounded border-taupe/30 text-accent focus:ring-accent"
              />
            </label>
          </div>

          {/* User Historical Baseline Settings */}
          <div className="space-y-2 pt-2 border-t border-taupe/15">
            <span className="text-[11px] font-semibold text-taupe uppercase tracking-wider block">
              Sender Historical Baseline
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-taupe text-[10px]">Historical Mean</label>
                <input
                  type="number"
                  value={userMean}
                  onChange={(e) => setUserMean(Number(e.target.value))}
                  className="w-full p-2 text-xs font-mono rounded-lg bg-background border border-taupe/20 text-text-main"
                />
              </div>
              <div>
                <label className="text-taupe text-[10px]">Std Deviation (σ)</label>
                <input
                  type="number"
                  value={userStd}
                  onChange={(e) => setUserStd(Number(e.target.value))}
                  className="w-full p-2 text-xs font-mono rounded-lg bg-background border border-taupe/20 text-text-main"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Output & Attribution Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Risk Gauge Banner */}
          {modified && (
            <div className="p-6 rounded-2xl bg-surface border border-taupe/25 shadow-soft space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-taupe/15">
                <div>
                  <span className="text-[10px] font-mono uppercase bg-accent/15 text-accent px-1.5 py-0.5 rounded font-bold">
                    MODEL SIMULATION OUTPUT
                  </span>
                  <h3 className="font-bold text-xl text-text-main mt-1">Calibrated Ensemble Risk Score</h3>
                  <p className="text-xs text-taupe">{result.explanation}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-3xl font-bold font-mono text-text-main">
                      {modified.ensemble_risk_score}
                      <span className="text-xs text-taupe font-normal">/100</span>
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase shadow-soft ${
                      modified.risk_level === 'CRITICAL'
                        ? 'bg-alert-red text-white'
                        : modified.risk_level === 'HIGH'
                        ? 'bg-accent text-white'
                        : modified.risk_level === 'MEDIUM'
                        ? 'bg-amber-500 text-white'
                        : 'bg-sage text-white'
                    }`}
                  >
                    {modified.risk_level} RISK
                  </span>
                </div>
              </div>

              {/* 3 Detectors Breakdown Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-background/60 border border-taupe/20 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-taupe block">Method 1: IQR Dispersion</span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-text-main">{modified.iqr_flag ? 'Flagged' : 'Normal'}</span>
                    <span className={`text-[10px] font-mono font-bold ${modified.iqr_flag ? 'text-alert-red' : 'text-sage'}`}>
                      {modified.iqr_score} pts
                    </span>
                  </div>
                  <p className="text-[10px] text-taupe leading-tight">{modified.iqr_reason}</p>
                </div>

                <div className="p-3 rounded-xl bg-background/60 border border-taupe/20 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-taupe block">Method 2: Isolation Forest</span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-text-main">{modified.iforest_flag ? 'Isolated' : 'Dense'}</span>
                    <span className={`text-[10px] font-mono font-bold ${modified.iforest_flag ? 'text-accent' : 'text-sage'}`}>
                      {modified.iforest_score} pts
                    </span>
                  </div>
                  <p className="text-[10px] text-taupe leading-tight">{modified.iforest_reason}</p>
                </div>

                <div className="p-3 rounded-xl bg-background/60 border border-taupe/20 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-taupe block">Method 3: Velocity Pacing</span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-text-main">{modified.timeseries_flag ? 'Burst Detected' : 'Normal'}</span>
                    <span className={`text-[10px] font-mono font-bold ${modified.timeseries_flag ? 'text-alert-red' : 'text-sage'}`}>
                      {modified.timeseries_score} pts
                    </span>
                  </div>
                  <p className="text-[10px] text-taupe leading-tight">{modified.timeseries_reason}</p>
                </div>
              </div>

              {/* Triggered Signals Pills */}
              <div className="space-y-1 pt-1">
                <span className="text-xs font-semibold text-charcoal">Triggered Forensic Signals:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {modified.detection_signals.length > 0 ? (
                    modified.detection_signals.map((sig, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-surface border border-accent/30 text-accent font-mono text-[10px] font-semibold"
                      >
                        {sig}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-taupe italic">No anomalous forensic triggers tripped.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Explainable Feature Attribution Waterfall Table */}
          {result?.attribution && (
            <div className="p-6 rounded-2xl bg-surface border border-taupe/25 shadow-soft space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-taupe/15">
                <div>
                  <h4 className="font-bold text-sm text-text-main flex items-center gap-2">
                    <Layers className="w-4 h-4 text-accent" />
                    Explainable Risk Feature Attribution Waterfall
                  </h4>
                  <p className="text-xs text-taupe">Exact point additions explaining why the model prioritized this transaction.</p>
                </div>
              </div>

              <div className="border border-taupe/20 rounded-xl overflow-hidden bg-background/50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface/80 border-b border-taupe/20 font-mono text-[11px] text-taupe">
                    <tr>
                      <th className="py-2.5 px-3">Contributing Risk Factor</th>
                      <th className="py-2.5 px-3">Signal Rationale</th>
                      <th className="py-2.5 px-3 text-right">Attribution Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-taupe/15 font-mono">
                    {result.attribution.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface/60 transition-colors">
                        <td className="py-2 px-3 font-semibold text-text-main font-sans">{item.factor}</td>
                        <td className="py-2 px-3 text-taupe font-sans text-[11px]">{item.description}</td>
                        <td className="py-2 px-3 text-right font-bold text-accent">+{item.points} pts</td>
                      </tr>
                    ))}
                    <tr className="bg-surface/80 font-bold border-t border-taupe/30">
                      <td colSpan={2} className="py-2.5 px-3 text-text-main font-sans">
                        Final Calibrated Risk Score (Capped 0–100)
                      </td>
                      <td className="py-2.5 px-3 text-right text-text-main font-bold">
                        {modified?.ensemble_risk_score} pts
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
