import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from 'recharts';
import {
  TrendingUp, DollarSign, Calculator, AlertCircle, CheckCircle2,
  Sliders, ShieldAlert, ArrowRight, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { BusinessImpactSimResponse } from '../types';
import { useTheme } from '../context/ThemeContext';

export const BusinessImpactPage: React.FC = () => {
  const { theme } = useTheme();
  // Scenario Hyperparameters
  const [costPerInvestigation, setCostPerInvestigation] = useState<number>(350);
  const [lossRecoveryRate, setLossRecoveryRate] = useState<number>(85);
  const [unmitigatedMultiplier, setUnmitigatedMultiplier] = useState<number>(1.2);
  const [riskThreshold, setRiskThreshold] = useState<number>(65);
  const [selectedModel, setSelectedModel] = useState<string>('ensemble');

  const [simData, setSimData] = useState<BusinessImpactSimResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.simulateBusinessImpact({
        cost_per_investigation: costPerInvestigation,
        loss_recovery_rate_pct: lossRecoveryRate,
        unmitigated_loss_multiplier: unmitigatedMultiplier,
        risk_score_threshold: riskThreshold,
        selected_model: selectedModel,
      });
      setSimData(res);
    } catch (err: any) {
      setError(err.message || 'Simulation execution failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [costPerInvestigation, lossRecoveryRate, unmitigatedMultiplier, riskThreshold, selectedModel]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-taupe/20">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-accent font-bold">
            FINANCIAL DECISION SUPPORT
          </span>
          <h1 className="text-3xl font-bold font-editorial text-text-main mt-0.5">
            Business Impact & Cost-Sensitivity Analysis
          </h1>
          <p className="text-xs text-charcoal/80 mt-1">
            Simulate operational triage workload, averted fraud losses, and net economic benefit across alert thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg border border-taupe/20 text-xs text-taupe font-mono">
          <Calculator className="w-4 h-4 text-accent" />
          <span>Economic Decision Engine</span>
        </div>
      </div>

      {/* Assumptions & Parameter Controls Card */}
      <div className="p-6 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-taupe/15">
          <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" />
            Hypothetical Operational & Financial Assumptions
          </h3>
          <span className="text-[11px] font-mono text-taupe">Interactive Parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          {/* Slider 1: Cost per Investigation */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-taupe">Cost per Investigation:</span>
              <span className="font-mono font-bold text-text-main">₹{costPerInvestigation}</span>
            </div>
            <input
              type="range"
              min="100"
              max="1500"
              step="50"
              value={costPerInvestigation}
              onChange={(e) => setCostPerInvestigation(parseFloat(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
            <p className="text-[10px] text-taupe leading-tight">Analyst wage, tooling, manual outreach</p>
          </div>

          {/* Slider 2: Recovery Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-taupe">Loss Recovery Rate:</span>
              <span className="font-mono font-bold text-text-main">{lossRecoveryRate}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="100"
              step="5"
              value={lossRecoveryRate}
              onChange={(e) => setLossRecoveryRate(parseFloat(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
            <p className="text-[10px] text-taupe leading-tight">Percentage of loss averted if caught prior to settlement</p>
          </div>

          {/* Slider 3: Unmitigated Multiplier */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-taupe">Missed Fraud Multiplier:</span>
              <span className="font-mono font-bold text-text-main">{unmitigatedMultiplier.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="2.5"
              step="0.1"
              value={unmitigatedMultiplier}
              onChange={(e) => setUnmitigatedMultiplier(parseFloat(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
            <p className="text-[10px] text-taupe leading-tight">Chargeback fees, operational overhead, customer churn</p>
          </div>

          {/* Slider 4: Risk Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-taupe">Risk Alert Threshold:</span>
              <span className="font-mono font-bold text-accent-dark">&ge; {riskThreshold} Score</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              step="5"
              value={riskThreshold}
              onChange={(e) => setRiskThreshold(parseFloat(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
            <p className="text-[10px] text-taupe leading-tight">Minimum score required to trigger an analyst alert</p>
          </div>
        </div>
      </div>

      {/* KPI Financial Simulation Cards */}
      {simData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Workload */}
          <div className="p-5 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-1">
            <span className="text-[11px] text-taupe font-medium uppercase tracking-wider block">
              Investigation Workload
            </span>
            <div className="text-2xl font-bold font-tabular text-text-main">
              {simData.investigation_workload_alerts.toLocaleString()}
            </div>
            <p className="text-[11px] text-taupe">
              {simData.true_positives} True Positives • {simData.false_positives} False Alarms
            </p>
          </div>

          {/* Total Loss Avoided */}
          <div className="p-5 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-1">
            <span className="text-[11px] text-taupe font-medium uppercase tracking-wider block">
              Estimated Loss Avoided
            </span>
            <div className="text-2xl font-bold font-tabular text-sage">
              ₹{(simData.estimated_loss_avoided / 100000).toFixed(2)}L
            </div>
            <p className="text-[11px] text-taupe">
              {((simData.estimated_loss_avoided / Math.max(1, simData.simulated_fraud_amount_total)) * 100).toFixed(1)}% of total simulated fraud
            </p>
          </div>

          {/* Investigation Operational Cost */}
          <div className="p-5 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-1">
            <span className="text-[11px] text-taupe font-medium uppercase tracking-wider block">
              Operational Triage Cost
            </span>
            <div className="text-2xl font-bold font-tabular text-alert">
              ₹{(simData.total_investigation_cost / 100000).toFixed(2)}L
            </div>
            <p className="text-[11px] text-taupe">
              ₹{costPerInvestigation} × {simData.investigation_workload_alerts} alerts
            </p>
          </div>

          {/* Estimated Net Benefit */}
          <div className="p-5 rounded-2xl bg-accent/10 border border-accent/30 shadow-soft space-y-1">
            <span className="text-[11px] text-accent-dark font-medium uppercase tracking-wider block">
              Estimated Net Benefit
            </span>
            <div className="text-2xl font-bold font-tabular text-accent-dark">
              ₹{(simData.estimated_net_benefit / 100000).toFixed(2)}L
            </div>
            <p className="text-[11px] text-accent font-semibold font-mono">
              ROI: {simData.roi_percentage}%
            </p>
          </div>
        </div>
      )}

      {/* Threshold Tradeoff Curve Chart */}
      <div className="p-6 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-taupe/20">
          <div>
            <h3 className="font-bold text-base text-text-main">
              Threshold Trade-off Curve: Recall vs Investigation Workload vs Net Benefit
            </h3>
            <p className="text-xs text-taupe">
              Evaluating the optimal operational cut-off point where marginal fraud capture exceeds false alarm triage cost
            </p>
          </div>
          <span className="text-[11px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">
            Optimal Operating Point: ~65-70
          </span>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simData?.tradeoff_curve || []} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#2A2622' : '#A99B89'} opacity={0.25} />
              <XAxis
                dataKey="threshold"
                tick={{ fontSize: 10, fill: theme === 'dark' ? '#A6998A' : '#706456' }}
                label={{ value: 'Risk Score Threshold', position: 'insideBottom', offset: -10, fontSize: 11, fill: theme === 'dark' ? '#A6998A' : '#706456' }}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: theme === 'dark' ? '#A6998A' : '#706456' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: theme === 'dark' ? '#A6998A' : '#706456' }} />
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
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" dataKey="recall" name="Recall (%)" stroke="#88A882" strokeWidth={2.5} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="precision" name="Precision (%)" stroke={theme === 'dark' ? '#E3D9CC' : '#292520'} strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="alert_volume" name="Alert Workload (Count)" stroke="#E07A3E" strokeWidth={2} dot={false} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Formula Transparency Box */}
      <div className="p-5 rounded-2xl bg-surface border border-taupe/20 space-y-2 text-xs text-charcoal/80 leading-relaxed">
        <h4 className="font-bold text-text-main flex items-center gap-1.5 text-sm">
          <HelpCircle className="w-4 h-4 text-accent" />
          Transparent Economic Formula
        </h4>
        <p className="font-mono text-[11px] text-charcoal bg-surface-subtle p-3 rounded-lg border border-taupe/20">
          Estimated Net Benefit = (Detected Fraud Value × Recovery Rate) - (Total Alerts × Cost per Investigation) - (Missed Fraud Value × Unmitigated Multiplier)
        </p>
        <p className="text-[11px] text-taupe">
          *Note: Financial outputs are illustrative scenario simulations calibrated on synthetic distributions to support executive triage decisions.
        </p>
      </div>
    </div>
  );
};
