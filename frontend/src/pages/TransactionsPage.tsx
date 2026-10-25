import React, { useState, useEffect } from 'react';
import {
  Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown,
  ShieldAlert, CheckCircle2, AlertTriangle, Eye, RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { Transaction, Investigation } from '../types';
import { TransactionModal } from '../components/TransactionModal';

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('all');
  const [riskLevel, setRiskLevel] = useState<string>('all');
  const [reviewStatus, setReviewStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal inspection
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTransactions({
        page,
        pageSize: 25,
        search,
        merchantCategory: category,
        riskLevel,
        reviewStatus,
        sortBy,
        sortOrder,
      });
      setTransactions(res.transactions);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, category, riskLevel, reviewStatus, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleModalUpdate = (updatedInv: Investigation) => {
    if (selectedTxn) {
      const updated = { ...selectedTxn, investigation: updatedInv };
      setSelectedTxn(updated);
      setTransactions((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-alert/15 text-alert border-alert/30';
      case 'HIGH':
        return 'bg-accent/15 text-accent-dark border-accent/30';
      case 'MEDIUM':
        return 'bg-taupe/20 text-charcoal border-taupe/30';
      default:
        return 'bg-sage/15 text-sage border-sage/30';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Escalated':
        return 'bg-alert text-white';
      case 'Under Review':
        return 'bg-accent text-white';
      case 'Reviewed':
        return 'bg-sage text-white';
      default:
        return 'bg-surface border border-taupe/30 text-charcoal';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-taupe/20">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-accent font-bold">
            FORENSIC WORKBENCH
          </span>
          <h1 className="text-3xl font-bold font-editorial text-text-main mt-0.5">
            Transaction Risk Explorer
          </h1>
          <p className="text-xs text-charcoal/80 mt-1">
            Sort, filter, and investigate suspicious payment anomalies with persistent case notes.
          </p>
        </div>

        <div className="text-xs font-mono text-taupe bg-surface px-3 py-1.5 rounded-lg border border-taupe/20">
          Showing <span className="font-bold text-text-main">{transactions.length}</span> of{' '}
          <span className="font-bold text-text-main">{total.toLocaleString('en-IN')}</span> records
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-surface border border-taupe/20 shadow-soft space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-taupe" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Transaction ID, Sender ID, Receiver, or City..."
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-lg bg-surface-subtle border border-taupe/30 text-text-main placeholder-taupe/60 focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-dark transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Category */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="p-2 rounded-lg bg-surface-subtle border border-taupe/30 text-charcoal focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="grocery">Grocery</option>
            <option value="food_dining">Food & Dining</option>
            <option value="utilities_bills">Utilities & Bills</option>
            <option value="electronics">Electronics</option>
            <option value="jewelry_luxury">Jewelry & Luxury</option>
            <option value="travel_booking">Travel Booking</option>
            <option value="peer_transfer">Peer Transfer</option>
            <option value="crypto_p2p_simulation">Crypto P2P Sim</option>
            <option value="gaming_entertainment">Gaming & Ent.</option>
          </select>

          {/* Risk Level */}
          <select
            value={riskLevel}
            onChange={(e) => {
              setRiskLevel(e.target.value);
              setPage(1);
            }}
            className="p-2 rounded-lg bg-surface-subtle border border-taupe/30 text-charcoal focus:outline-none"
          >
            <option value="all">All Risk Tiers</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          {/* Review Status */}
          <select
            value={reviewStatus}
            onChange={(e) => {
              setReviewStatus(e.target.value);
              setPage(1);
            }}
            className="p-2 rounded-lg bg-surface-subtle border border-taupe/30 text-charcoal focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Under Review">Under Review</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Escalated">Escalated</option>
          </select>

          {(search || category !== 'all' || riskLevel !== 'all' || reviewStatus !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setCategory('all');
                setRiskLevel('all');
                setReviewStatus('all');
                setPage(1);
              }}
              className="flex items-center gap-1 p-2 rounded-lg text-taupe hover:text-text-main transition-colors ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl bg-surface border border-taupe/20 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle border-b border-taupe/20 text-[11px] font-mono uppercase tracking-wider text-taupe">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4 cursor-pointer hover:text-text-main" onClick={() => handleSort('timestamp')}>
                  <div className="flex items-center gap-1">
                    <span>Timestamp</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Sender</th>
                <th className="py-3 px-4">Receiver</th>
                <th className="py-3 px-4 cursor-pointer hover:text-text-main text-right" onClick={() => handleSort('amount')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount (INR)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Merchant Category</th>
                <th className="py-3 px-4 cursor-pointer hover:text-text-main text-center" onClick={() => handleSort('ensemble_risk_score')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Risk Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Signals</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-taupe/15 text-xs text-charcoal">
              {loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-taupe font-mono">
                    Loading transactions from PostgreSQL...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-taupe font-mono">
                    No transactions matched the selected filters.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const risk = txn.detection?.risk_level || 'LOW';
                  const score = txn.detection?.ensemble_risk_score || 0;
                  const status = txn.investigation?.review_status || 'New';

                  return (
                    <tr
                      key={txn.id}
                      onClick={() => setSelectedTxn(txn)}
                      className="hover:bg-surface-subtle/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-text-main">
                        {txn.id.slice(0, 16)}...
                      </td>
                      <td className="py-3 px-4 text-taupe font-mono">
                        {txn.timestamp.replace('T', ' ').slice(0, 19)}
                      </td>
                      <td className="py-3 px-4 font-medium text-text-main">
                        <div>{txn.sender_name}</div>
                        <span className="text-[10px] text-taupe font-mono">{txn.location_city}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-text-main">{txn.receiver_name}</div>
                        <span className="text-[10px] text-taupe font-mono uppercase">{txn.channel}</span>
                      </td>
                      <td className="py-3 px-4 font-tabular font-bold text-right text-text-main">
                        ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-taupe/10 text-charcoal">
                          {txn.merchant_category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskBadge(risk)}`}>
                          {score.toFixed(0)} ({risk})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {txn.detection?.iqr_flag && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-accent/15 text-accent-dark font-bold" title="IQR Outlier">
                              IQR
                            </span>
                          )}
                          {txn.detection?.iforest_flag && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-charcoal text-white font-bold" title="Isolation Forest Anomaly">
                              IFO
                            </span>
                          )}
                          {txn.detection?.timeseries_flag && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-alert/20 text-alert font-bold" title="Time-Series Velocity">
                              TS
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusBadge(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTxn(txn);
                          }}
                          className="p-1 rounded text-taupe hover:text-accent"
                          title="Open Investigation Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-surface-subtle border-t border-taupe/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-taupe font-mono">
          <div>
            Page <span className="font-bold text-text-main">{page}</span> of{' '}
            <span className="font-bold text-text-main">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-taupe/30 bg-surface text-charcoal hover:bg-surface-subtle disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">Jump Page: {page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-taupe/30 bg-surface text-charcoal hover:bg-surface-subtle disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Investigation Drawer Modal */}
      <TransactionModal
        transaction={selectedTxn}
        onClose={() => setSelectedTxn(null)}
        onUpdate={handleModalUpdate}
      />
    </div>
  );
};
