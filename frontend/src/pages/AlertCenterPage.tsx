import React, { useState, useEffect } from 'react';
import {
  BellRing, Filter, ShieldAlert, CheckCircle2, Clock,
  ArrowRight, Search, RotateCcw, AlertTriangle, UserCheck,
  ChevronRight, ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import type { Transaction, Investigation } from '../types';
import { TransactionModal } from '../components/TransactionModal';

export const AlertCenterPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalAlerts, setTotalAlerts] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [riskTier, setRiskTier] = useState<string>('all');
  const [reviewStatus, setReviewStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Modal inspection
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTransactions({
        page,
        pageSize: 25,
        riskLevel: riskTier === 'all' ? undefined : riskTier,
        reviewStatus: reviewStatus === 'all' ? undefined : reviewStatus,
        search: search.trim() || undefined,
        sortBy: 'ensemble_risk_score',
        sortOrder: 'desc',
      });
      // Filter for alerts (score >= 40 or High/Critical)
      setTransactions(res.transactions);
      setTotalAlerts(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch alert triage queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, riskTier, reviewStatus, search]);

  const handleUpdate = (updated: Investigation) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updated.transaction_id ? { ...t, investigation: updated } : t))
    );
    if (selectedTxn && selectedTxn.id === updated.transaction_id) {
      setSelectedTxn({ ...selectedTxn, investigation: updated });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-taupe/20">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-alert-red font-bold flex items-center gap-1.5">
            <BellRing className="w-3.5 h-3.5" />
            OPERATIONAL ALERT CENTER
          </span>
          <h1 className="text-3xl font-bold font-editorial text-text-main mt-0.5">
            Active Anomaly Triage & SLA Queue
          </h1>
          <p className="text-xs text-charcoal/80 mt-1">
            Prioritized alert triage desk for human investigator review, multi-model consensus, and audit trails.
          </p>
        </div>

        {/* Filters Strip */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-taupe" />
            <input
              type="text"
              placeholder="Filter by ID, User, or City..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-surface border border-taupe/20 text-text-main placeholder-taupe/60 focus:outline-none focus:border-accent"
            />
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-xl border border-taupe/20 text-xs shadow-soft">
            <select
              value={riskTier}
              onChange={(e) => {
                setRiskTier(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-charcoal font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-surface">All Risk Alerts</option>
              <option value="CRITICAL" className="bg-surface">Critical Only</option>
              <option value="HIGH" className="bg-surface">High Only</option>
              <option value="MEDIUM" className="bg-surface">Medium Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-xl border border-taupe/20 text-xs shadow-soft">
            <select
              value={reviewStatus}
              onChange={(e) => {
                setReviewStatus(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-charcoal font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-surface">All Review States</option>
              <option value="New" className="bg-surface">New (Unreviewed)</option>
              <option value="Under Review" className="bg-surface">Under Review</option>
              <option value="Reviewed" className="bg-surface">Reviewed</option>
              <option value="Escalated" className="bg-surface">Escalated</option>
              <option value="Closed" className="bg-surface">Closed</option>
            </select>
          </div>

          <button
            onClick={fetchAlerts}
            className="p-2 rounded-xl bg-surface border border-taupe/20 text-charcoal hover:text-accent shadow-soft transition-all"
            title="Refresh Alert Queue"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SLA Triage Table */}
      <div className="p-6 rounded-2xl bg-surface border border-taupe/25 shadow-soft space-y-4">
        <div className="flex items-center justify-between text-xs text-taupe">
          <span>
            Queue Count: <strong className="text-text-main font-mono">{totalAlerts}</strong> Priority Alerts
          </span>
          <span className="flex items-center gap-1 text-[11px] text-accent">
            <Clock className="w-3.5 h-3.5" />
            SLA Standard: Critical cases require review within 2 hours
          </span>
        </div>

        <div className="border border-taupe/20 rounded-xl overflow-x-auto bg-background/50">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/80 border-b border-taupe/20 font-mono text-[11px] text-taupe">
              <tr>
                <th className="py-2.5 px-3">Alert ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Sender / Origin</th>
                <th className="py-2.5 px-3">Receiver / Category</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Analyst Notes</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-taupe/15">
              {transactions.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-taupe">
                    No active alerts matching selected criteria.
                  </td>
                </tr>
              )}
              {transactions.map((t) => {
                const score = t.detection?.ensemble_risk_score || 0;
                const status = t.investigation?.review_status || 'New';
                const isCritical = score >= 75;

                return (
                  <tr key={t.id} className="hover:bg-surface/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-accent">{t.id}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-taupe whitespace-nowrap">
                      {new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-text-main">{t.sender_name}</div>
                      <div className="text-[10px] text-taupe">{t.location_city} ({t.device_type})</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-text-main">{t.receiver_name}</div>
                      <div className="text-[10px] text-taupe capitalize">{t.merchant_category.replace(/_/g, ' ')}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-text-main text-right">
                      ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span className={isCritical ? 'text-alert-red' : score >= 50 ? 'text-accent' : 'text-amber-600'}>
                        {score}/100
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                          status === 'Escalated'
                            ? 'bg-alert-red/20 text-alert-red border border-alert-red/30'
                            : status === 'Reviewed' || status === 'Closed'
                            ? 'bg-sage/20 text-sage border border-sage/30'
                            : status === 'Under Review'
                            ? 'bg-accent/20 text-accent border border-accent/30'
                            : 'bg-taupe/20 text-charcoal border border-taupe/30'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-taupe text-[11px] truncate max-w-[160px]">
                      {t.investigation?.analyst_notes || <span className="italic text-taupe/50">None documented</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedTxn(t)}
                        className="px-2.5 py-1 rounded-lg bg-surface border border-taupe/25 hover:border-accent text-accent font-medium text-[11px] shadow-soft transition-colors"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Strip */}
        <div className="flex items-center justify-between pt-2 text-xs text-taupe">
          <span>Showing page {page}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded-lg bg-surface border border-taupe/20 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={transactions.length < 25}
              className="px-3 py-1 rounded-lg bg-surface border border-taupe/20 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Forensic Modal */}
      {selectedTxn && (
        <TransactionModal
          transaction={selectedTxn}
          onClose={() => setSelectedTxn(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};
