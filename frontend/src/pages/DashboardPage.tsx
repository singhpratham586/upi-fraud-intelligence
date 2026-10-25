import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Legend
} from 'recharts';
import {
  RotateCcw, Filter, AlertTriangle, ShieldCheck, DollarSign,
  TrendingUp, Activity, HelpCircle, ArrowUpRight, CheckCircle2,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardData } from '../types';
import { useTheme } from '../context/ThemeContext';

export const DashboardPage: React.FC = () => {
  const { theme } = useTheme();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [category, setCategory] = useState<string>('all');
  const [riskLevel, setRiskLevel] = useState<string>('all');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboard(category, riskLevel);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [category, riskLevel]);

  const handleResetFilters = () => {
    setCategory('all');
    setRiskLevel('all');
  };

  const categoriesList = [
    { value: 'all', label: 'All Categories' },
    { value: 'grocery', label: 'Grocery' },
    { value: 'food_dining', label: 'Food & Dining' },
    { value: 'utilities_bills', label: 'Utilities & Bills' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'jewelry_luxury', label: 'Jewelry & Luxury' },
    { value: 'travel_booking', label: 'Travel Booking' },
    { value: 'peer_transfer', label: 'Peer-to-Peer Transfer' },
    { value: 'crypto_p2p_simulation', label: 'Crypto P2P Sim' },
    { value: 'gaming_entertainment', label: 'Gaming & Ent.' },
  ];

  if (loading && !data) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-sm text-taupe font-mono">Aggregating PostgreSQL Telemetry...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 rounded-2xl bg-surface border border-alert/30 text-center space-y-4 my-8">
        <AlertTriangle className="w-8 h-8 text-alert mx-auto" />
        <h3 className="font-bold text-lg text-text-main">Unable to Load Dashboard</h3>
        <p className="text-xs text-taupe max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const kpis = data?.kpis;

  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#181614' : '#FFF9F0',
    borderColor: theme === 'dark' ? '#38322B' : '#A99B89',
    color: theme === 'dark' ? '#F7F2EB' : '#171512',
    borderRadius: '8px',
    fontSize: '11px',
    boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.3)',
  };
  const axisColor = theme === 'dark' ? '#A6998A' : '#706456';
  const gridColor = theme === 'dark' ? '#2A2622' : '#A99B89';
  const primaryBarColor = theme === 'dark' ? '#E3D9CC' : '#292520';

  return (
    <div className="space-y-8">
      {/* Top Bar: Title & Dynamic Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-taupe/20">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-accent font-bold">
            EXECUTIVE INTELLIGENCE
          </span>
          <h1 className="text-3xl font-bold font-editorial text-text-main mt-0.5">
            Transaction Risk & Portfolio Overview
          </h1>
          <p className="text-xs text-charcoal/80 mt-1">
            Realtime aggregations across 12,423 synthetic UPI payment records.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-xl border border-taupe/20 text-xs shadow-soft">
            <Filter className="w-3.5 h-3.5 text-taupe" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent text-charcoal font-medium focus:outline-none cursor-pointer"
            >
              {categoriesList.map((c) => (
                <option key={c.value} value={c.value} className="bg-surface">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-xl border border-taupe/20 text-xs shadow-soft">
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="bg-transparent text-charcoal font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-surface">All Risk Tiers</option>
              <option value="CRITICAL" className="bg-surface">Critical Risk</option>
              <option value="HIGH" className="bg-surface">High Risk</option>
              <option value="MEDIUM" className="bg-surface">Medium Risk</option>
              <option value="LOW" className="bg-surface">Low Risk</option>
            </select>
          </div>

          {(category !== 'all' || riskLevel !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface border border-taupe/20 text-xs text-taupe hover:text-text-main transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip (6 Essential Metrics) */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Card 1 */}
          <div className="p-4 rounded-xl bg-surface border border-taupe/20 shadow-soft space-y-1">
            <div className="flex items-center justify-between text-taupe">
              <span className="text-[11px] font-medium uppercase tracking-wider">Total Volume</span>
              <Activity className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="font-tabular font-bold text-xl text-text-main">
              {kpis.total_transactions.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-taupe leading-tight">Settled UPI payments</p>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-xl bg-surface border border-taupe/20 shadow-soft space-y-1">
            <div className="flex items-center justify-between text-taupe">
              <span className="text-[11px] font-medium uppercase tracking-wider">Gross Value</span>
              <DollarSign className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="font-tabular font-bold text-xl text-text-main">
              ₹{(kpis.total_transaction_value / 1000000).toFixed(1)}M
            </div>
            <p className="text-[10px] text-taupe leading-tight">Total capital throughput</p>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-xl bg-surface border border-taupe/20 shadow-soft space-y-1">
            <div className="flex items-center justify-between text-taupe">
              <span className="text-[11px] font-medium uppercase tracking-wider">Flagged Alerts</span>
              <AlertTriangle className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="font-tabular font-bold text-xl text-accent-dark">
              {kpis.flagged_transactions.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-accent font-semibold leading-tight">
              {kpis.flagged_rate_pct}% alert rate
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-4 rounded-xl bg-surface border border-taupe/20 shadow-soft space-y-1">
            <div className="flex items-center justify-between text-taupe">
              <span className="text-[11px] font-medium uppercase tracking-wider">Simulated Fraud</span>
              <ShieldCheck className="w-3.5 h-3.5 text-sage" />
            </div>
            <div className="font-tabular font-bold text-xl text-text-main">
              {kpis.simulated_fraud_count}
            </div>
            <p className="text-[10px] text-taupe leading-tight">
              {kpis.simulated_fraud_rate_pct}% ground truth
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-4 rounded-xl bg-surface border border-taupe/20 shadow-soft space-y-1">
            <div className="flex items-center justify-between text-taupe">
              <span className="text-[11px] font-medium uppercase tracking-wider">Flagged Value</span>
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="font-tabular font-bold text-xl text-text-main">
              ₹{(kpis.estimated_flagged_value / 100000).toFixed(1)}L
            </div>
            <p className="text-[10px] text-taupe leading-tight">Triage exposure pool</p>
          </div>

          {/* Card 6 */}
          <div className="p-4 rounded-xl bg-surface border border-taupe/20 shadow-soft space-y-1">
            <div className="flex items-center justify-between text-taupe">
              <span className="text-[11px] font-medium uppercase tracking-wider">False Positives</span>
              <Info className="w-3.5 h-3.5 text-taupe" />
            </div>
            <div className="font-tabular font-bold text-xl text-charcoal">
              {kpis.false_positive_rate_pct}%
            </div>
            <p className="text-[10px] text-sage font-medium leading-tight">
              {kpis.precision_pct}% Precision
            </p>
          </div>
        </div>
      )}

      {/* Deterministic Data-Backed Insights Panel */}
      {data?.deterministic_insights && data.deterministic_insights.length > 0 && (
        <div className="p-5 rounded-2xl bg-surface border border-accent/25 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-text-main">
                Deterministic Algorithmic Findings (Data-Supported)
              </h3>
            </div>
            <span className="text-[11px] text-taupe font-mono">Live SQL Observation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {data.deterministic_insights.map((ins) => (
              <div
                key={ins.id}
                className="p-3.5 rounded-xl bg-background border border-taupe/15 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-main">{ins.title}</span>
                  {ins.metric_value && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/15 text-accent-dark font-bold">
                      {ins.metric_value}
                    </span>
                  )}
                </div>
                <p className="text-xs text-charcoal/90 font-medium">{ins.observation}</p>
                <p className="text-[11px] text-taupe leading-relaxed">{ins.data_support}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 1 Charts: Volume Over Time & High-Risk Activity Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Volume Over Time */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-text-main">Transaction Volume Over Time</h3>
              <p className="text-xs text-taupe">Daily counts of settled transactions vs flagged alerts</p>
            </div>
            <span className="text-[11px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">
              35-Day Trajectory
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.volume_trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryBarColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={primaryBarColor} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="flaggedColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C96B35" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#C96B35" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.25} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: axisColor }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: axisColor }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="total_count" name="Total Volume" stroke={primaryBarColor} strokeWidth={2} fillOpacity={1} fill="url(#totalColor)" />
                <Area type="monotone" dataKey="flagged_count" name="Flagged Alerts" stroke="#C96B35" strokeWidth={2} fillOpacity={1} fill="url(#flaggedColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: High Risk Tiers Trend */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-text-main">Risk Severity Tiers</h3>
              <p className="text-xs text-taupe">Distribution across Critical, High, Medium, Low</p>
            </div>
            <span className="text-[11px] font-mono text-taupe">Severity Trend</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.high_risk_trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.25} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: axisColor }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: axisColor }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" stackId="1" dataKey="critical_count" name="Critical" stroke="#B84A3B" fill="#B84A3B" />
                <Area type="monotone" stackId="1" dataKey="high_count" name="High" stroke="#C96B35" fill="#C96B35" />
                <Area type="monotone" stackId="1" dataKey="medium_count" name="Medium" stroke={axisColor} fill={axisColor} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Category Breakdown & Amount Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-text-main">Transactions by Merchant Vertical</h3>
              <p className="text-xs text-taupe">Transaction count vs flagged alert density</p>
            </div>
            <span className="text-[11px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">
              Vertically Partitioned
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.category_breakdown || []} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.25} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 9, fill: axisColor }}
                  angle={-25}
                  textAnchor="end"
                  tickFormatter={(c) => c.replace('_', ' ')}
                />
                <YAxis tick={{ fontSize: 10, fill: axisColor }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="transaction_count" name="Total Txns" fill={primaryBarColor} radius={[4, 4, 0, 0]} />
                <Bar dataKey="flagged_count" name="Flagged Alerts" fill="#C96B35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Amount Distribution Bins */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-text-main">Amount Distribution Bins</h3>
              <p className="text-xs text-taupe">Right-tail exposure breakdown in INR</p>
            </div>
            <span className="text-[11px] font-mono text-taupe">Log Skew</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.amount_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.25} />
                <XAxis dataKey="range_label" tick={{ fontSize: 9, fill: axisColor }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: axisColor }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="normal_count" name="Legitimate" fill={axisColor} radius={[4, 4, 0, 0]} opacity={0.5} />
                <Bar dataKey="flagged_count" name="Flagged" fill="#B84A3B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Hour-of-Day Activity Heatmap Grid */}
      <div className="p-6 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-text-main">Diurnal Hour-of-Day Activity Heatmap</h3>
            <p className="text-xs text-taupe">
              Hourly transaction volume across all days of the week (24h clock)
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-taupe">
            <span>Low</span>
            <div className="flex gap-1">
              <span className="w-3 h-3 rounded bg-taupe/15" />
              <span className="w-3 h-3 rounded bg-accent/30" />
              <span className="w-3 h-3 rounded bg-accent/70" />
              <span className="w-3 h-3 rounded bg-accent" />
            </div>
            <span>Peak</span>
          </div>
        </div>

        {/* Heatmap Matrix */}
        <div className="overflow-x-auto pt-2">
          <div className="min-w-[650px] space-y-1.5">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dIdx) => (
              <div key={day} className="flex items-center gap-1.5">
                <span className="w-8 text-[11px] font-mono text-taupe font-semibold">{day}</span>
                <div className="grid grid-cols-24 gap-1 flex-1">
                  {Array.from({ length: 24 }).map((_, hr) => {
                    const point = data?.hourly_heatmap.find(
                      (p) => p.day_of_week === dIdx && p.hour === hr
                    );
                    const count = point ? point.total_count : 0;
                    // Color intensity
                    let bg = 'bg-taupe/10';
                    if (count > 80) bg = 'bg-accent text-white';
                    else if (count > 50) bg = 'bg-accent/70 text-white';
                    else if (count > 25) bg = 'bg-accent/35 text-charcoal';
                    else if (count > 10) bg = 'bg-taupe/25 text-charcoal';

                    return (
                      <div
                        key={hr}
                        title={`${day} ${hr}:00 - ${count} txns (${point?.flagged_count || 0} flagged)`}
                        className={`h-7 rounded flex items-center justify-center text-[9px] font-mono cursor-pointer transition-transform hover:scale-110 ${bg}`}
                      >
                        {count > 0 ? count : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {/* Hour Legend */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="w-8" />
              <div className="grid grid-cols-24 gap-1 flex-1 text-[9px] font-mono text-taupe">
                {Array.from({ length: 24 }).map((_, hr) => (
                  <span key={hr} className="text-center">{hr}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
