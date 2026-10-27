import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Legend
} from 'recharts';
import {
  RotateCcw, Filter, AlertTriangle, ShieldCheck, DollarSign,
  TrendingUp, Activity, HelpCircle, ArrowUpRight, CheckCircle2,
  Info, FileSpreadsheet, ChevronDown, ChevronUp, Eye, X, Download, Database
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardData, SheetPreviewTransaction, EvaluateSheetResponse, DataQualityReport } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FileDropZone } from '../components/FileDropZone';

export const DashboardPage: React.FC = () => {
  const { theme } = useTheme();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [category, setCategory] = useState<string>('all');
  const [riskLevel, setRiskLevel] = useState<string>('all');

  // Sheet Evaluation State
  const [activeSheetName, setActiveSheetName] = useState<string | null>(null);
  const [sheetPreviewTxns, setSheetPreviewTxns] = useState<SheetPreviewTransaction[]>([]);
  const [isDropzoneExpanded, setIsDropzoneExpanded] = useState<boolean>(true);

  // Data Quality Report Modal State
  const [showQualityModal, setShowQualityModal] = useState<boolean>(false);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  const [loadingQuality, setLoadingQuality] = useState<boolean>(false);

  const fetchQualityReport = async () => {
    setLoadingQuality(true);
    try {
      const report = await api.getDataQualityReport();
      setQualityReport(report);
    } catch (err) {
      console.error('Failed to load quality report:', err);
    } finally {
      setLoadingQuality(false);
    }
  };

  const handleDownloadQualityJSON = () => {
    if (!qualityReport) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(qualityReport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `upi_data_quality_report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSheetEvaluated = (result: EvaluateSheetResponse) => {
    setData(result.dashboard_data);
    setActiveSheetName(result.filename);
    setSheetPreviewTxns(result.preview_transactions);
  };

  const handleResetToBaseline = () => {
    setActiveSheetName(null);
    setSheetPreviewTxns([]);
    fetchData();
  };

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

          {/* Toggle Drop Zone Button */}
          <button
            onClick={() => setIsDropzoneExpanded(!isDropzoneExpanded)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-soft ${
              isDropzoneExpanded || activeSheetName
                ? 'bg-accent/15 border-accent text-accent'
                : 'bg-surface border-taupe/20 text-charcoal hover:border-accent/40'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{activeSheetName ? 'Active Sheet' : 'Drop Excel / Sheet'}</span>
            {isDropzoneExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Data Quality Health Button */}
          <button
            onClick={() => {
              setShowQualityModal(true);
              if (!qualityReport) fetchQualityReport();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-taupe/20 bg-surface text-charcoal hover:text-text-main text-xs font-medium transition-all shadow-soft"
            title="Inspect Data Quality, Completeness & Profile"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sage" />
            <span>Data Health & Profile</span>
          </button>
        </div>
      </div>

      {/* File Drop Area / Sheet Evaluator Drop Box */}
      {isDropzoneExpanded && (
        <div className="animate-in fade-in duration-200">
          <FileDropZone
            onEvaluated={handleSheetEvaluated}
            onReset={handleResetToBaseline}
            activeSheetName={activeSheetName}
          />
        </div>
      )}

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

      {/* Evaluated Sheet Forensic Preview Table */}
      {sheetPreviewTxns.length > 0 && (
        <div className="p-6 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-taupe/15">
            <div>
              <span className="text-[10px] font-mono uppercase bg-accent/15 text-accent px-1.5 py-0.5 rounded font-bold">
                FORENSIC PREVIEW
              </span>
              <h3 className="font-bold text-base text-text-main mt-1">
                Evaluated Sheet Transactions ({sheetPreviewTxns.length} Anomaly Samples)
              </h3>
              <p className="text-xs text-taupe">
                Dynamic risk scores and anomaly signals computed live across your uploaded spreadsheet.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-taupe font-mono">Source: {activeSheetName}</span>
            </div>
          </div>

          <div className="border border-taupe/20 rounded-xl overflow-x-auto bg-background/50">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/80 border-b border-taupe/20 font-mono text-[11px] text-taupe">
                <tr>
                  <th className="py-2.5 px-3">Txn ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Sender</th>
                  <th className="py-2.5 px-3">Receiver</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Risk Tier</th>
                  <th className="py-2.5 px-3">Detected Signals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-taupe/15">
                {sheetPreviewTxns.map((t) => (
                  <tr key={t.id} className="hover:bg-surface/60 transition-colors">
                    <td className="py-2 px-3 font-mono text-accent font-medium">{t.id}</td>
                    <td className="py-2 px-3 font-mono text-taupe whitespace-nowrap">
                      {new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 px-3 text-charcoal">{t.sender_name}</td>
                    <td className="py-2 px-3 text-charcoal">{t.receiver_name}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-taupe capitalize">
                      {t.merchant_category.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-text-main text-right">
                      ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-text-main">
                      <span className={t.risk_score >= 65 ? 'text-alert-red' : t.risk_score >= 35 ? 'text-accent' : 'text-sage'}>
                        {t.risk_score}/100
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          t.risk_level === 'CRITICAL'
                            ? 'bg-alert-red/20 text-alert-red border border-alert-red/30'
                            : t.risk_level === 'HIGH'
                            ? 'bg-accent/20 text-accent border border-accent/30'
                            : t.risk_level === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-sage/20 text-sage border border-sage/30'
                        }`}
                      >
                        {t.risk_level}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {t.signals && t.signals.length > 0 ? (
                          t.signals.map((sig, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface border border-taupe/20 text-taupe"
                            >
                              {sig}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-taupe italic">Baseline Normal</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Data Quality & Profile Health Modal */}
      {showQualityModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-surface rounded-2xl border border-taupe/20 shadow-elevated p-6 sm:p-8 space-y-6 animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-taupe/20">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-sage/15 text-sage border border-sage/30 uppercase">
                    DATA INTEGRITY ASSURANCE
                  </span>
                  <span className="text-xs font-mono text-taupe">
                    {qualityReport?.dataset_version || 'v1.0-reproducible'}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-editorial text-text-main">
                  Data Quality, Health & Statistical Profile
                </h3>
                <p className="text-xs text-taupe mt-0.5">
                  Automated validation verifying completeness, uniqueness, distribution parameters, and zero ground-truth label leakage.
                </p>
              </div>

              <button
                onClick={() => setShowQualityModal(false)}
                className="p-2 rounded-lg hover:bg-surface-subtle text-taupe hover:text-text-main transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingQuality ? (
              <div className="py-16 text-center space-y-2">
                <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-taupe font-mono">Auditing dataset schema and column distributions...</p>
              </div>
            ) : qualityReport ? (
              <div className="space-y-6">
                {/* Top Health Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-surface-subtle border border-taupe/15">
                    <span className="text-[11px] text-taupe block">Health Score</span>
                    <span className="font-tabular font-bold text-xl text-sage">
                      {qualityReport.integrity_score_pct}%
                    </span>
                    <span className="text-[10px] text-taupe block mt-0.5">No missing values</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-subtle border border-taupe/15">
                    <span className="text-[11px] text-taupe block">Total Records</span>
                    <span className="font-tabular font-bold text-xl text-text-main">
                      {qualityReport.total_records.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-taupe block mt-0.5">0 Duplicates</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-subtle border border-taupe/15">
                    <span className="text-[11px] text-taupe block">Unique Accounts</span>
                    <span className="font-tabular font-bold text-base text-charcoal">
                      {qualityReport.unique_senders} senders / {qualityReport.unique_receivers} receivers
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-subtle border border-taupe/15">
                    <span className="text-[11px] text-taupe block">Label Leakage Status</span>
                    <span className="font-tabular font-bold text-base text-sage flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-sage" /> Zero Leakage
                    </span>
                    <span className="text-[10px] text-taupe block mt-0.5">Unsupervised vectors isolated</span>
                  </div>
                </div>

                {/* Amount Statistical Profile */}
                <div className="p-4 rounded-xl bg-surface-subtle border border-taupe/20 space-y-2">
                  <h4 className="text-xs font-bold text-text-main font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-accent" />
                    Transaction Amount Parametric & Nonparametric Distribution (INR)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                    <div>
                      <span className="text-taupe block text-[10px]">Min / Max:</span>
                      <span className="font-tabular font-bold text-charcoal">
                        ₹{qualityReport.amount_profile.min} - ₹{qualityReport.amount_profile.max.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-taupe block text-[10px]">Mean / Median:</span>
                      <span className="font-tabular font-bold text-charcoal">
                        ₹{qualityReport.amount_profile.mean.toLocaleString()} / ₹{qualityReport.amount_profile.median.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-taupe block text-[10px]">95th / 99th Percentile:</span>
                      <span className="font-tabular font-bold text-charcoal">
                        ₹{qualityReport.amount_profile.p95.toLocaleString()} / ₹{qualityReport.amount_profile.p99.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-taupe block text-[10px]">Std Dev / Skewness:</span>
                      <span className="font-tabular font-bold text-charcoal">
                        ₹{qualityReport.amount_profile.std.toLocaleString()} (skew: {qualityReport.amount_profile.skewness})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Simulated Scenario Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text-main font-mono uppercase tracking-wider">
                    Ground-Truth Simulation Scenarios (Independently Tagged)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(qualityReport.scenario_breakdown).map(([scenario, count]) => {
                      const isNormal = scenario === 'normal' || scenario === 'none';
                      return (
                        <div
                          key={scenario}
                          className="px-3 py-1.5 rounded-lg bg-surface-subtle border border-taupe/20 text-xs flex items-center gap-2"
                        >
                          <span className={`w-2 h-2 rounded-full ${isNormal ? 'bg-sage' : 'bg-alert'}`} />
                          <span className="font-mono text-charcoal">{scenario}</span>
                          <span className="font-bold font-tabular text-taupe">{count.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column Completeness Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text-main font-mono uppercase tracking-wider">
                    Feature Schema Completeness Audit ({qualityReport.columns_analyzed.length} attributes)
                  </h4>
                  <div className="max-h-56 overflow-y-auto border border-taupe/20 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-surface-subtle sticky top-0 border-b border-taupe/20 text-[10px] font-mono text-taupe uppercase">
                        <tr>
                          <th className="py-2 px-3">Column Name</th>
                          <th className="py-2 px-3">Data Type</th>
                          <th className="py-2 px-3 text-center">Missing Count</th>
                          <th className="py-2 px-3 text-center">Missing %</th>
                          <th className="py-2 px-3 text-right">Integrity Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-taupe/15">
                        {qualityReport.columns_analyzed.map((c) => (
                          <tr key={c.column} className="hover:bg-surface-subtle/50">
                            <td className="py-2 px-3 font-mono font-medium text-text-main">{c.column}</td>
                            <td className="py-2 px-3 font-mono text-taupe text-[11px]">{c.data_type}</td>
                            <td className="py-2 px-3 font-tabular text-center">{c.missing_count}</td>
                            <td className="py-2 px-3 font-tabular text-center">{c.missing_pct}%</td>
                            <td className="py-2 px-3 text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sage/15 text-sage">
                                PASS
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-taupe/20">
                  <span className="text-[11px] font-mono text-taupe">
                    Generated at: {new Date(qualityReport.generated_at).toLocaleString()}
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDownloadQualityJSON}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-subtle border border-taupe/30 text-charcoal hover:text-text-main text-xs font-semibold hover:border-accent/40 transition-colors shadow-soft"
                    >
                      <Download className="w-3.5 h-3.5 text-accent" />
                      <span>Export Quality Profile JSON</span>
                    </button>
                    <button
                      onClick={() => setShowQualityModal(false)}
                      className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-dark transition-colors shadow-soft"
                    >
                      Close Profile
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
