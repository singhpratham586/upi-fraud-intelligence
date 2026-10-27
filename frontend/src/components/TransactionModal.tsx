import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, Clock, MapPin, Smartphone, User, ArrowRight, Save, AlertCircle, History, UserCheck, ShieldCheck } from 'lucide-react';
import { Transaction, Investigation, AuditEvent } from '../types';
import { api } from '../services/api';

interface TransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onUpdate: (updated: Investigation) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  transaction,
  onClose,
  onUpdate,
}) => {
  if (!transaction) return null;

  const currentStatus = transaction.investigation?.review_status || 'New';
  const [reviewStatus, setReviewStatus] = useState<string>(currentStatus);
  const [notes, setNotes] = useState<string>(transaction.investigation?.analyst_notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  const fetchAuditEvents = async () => {
    if (!transaction) return;
    setIsLoadingAudit(true);
    try {
      const events = await api.getAuditTrail(transaction.id);
      setAuditEvents(events);
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (transaction?.id) {
      setReviewStatus(transaction.investigation?.review_status || 'New');
      setNotes(transaction.investigation?.analyst_notes || '');
      fetchAuditEvents();
    }
  }, [transaction?.id]);

  const riskLevel = transaction.detection?.risk_level || 'LOW';
  const riskScore = transaction.detection?.ensemble_risk_score || 0;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await api.updateInvestigation(transaction.id, {
        review_status: reviewStatus,
        analyst_notes: notes,
        analyst_id: 'analyst_vikram',
      });
      onUpdate(updated);
      setSaveSuccess(true);
      await fetchAuditEvents();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert('Failed to update investigation status: ' + err);
    } finally {
      setIsSaving(false);
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-surface min-h-screen p-6 sm:p-8 flex flex-col shadow-elevated border-l border-taupe/20 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-taupe/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-taupe">{transaction.id}</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getRiskBadge(
                  riskLevel
                )}`}
              >
                {riskLevel} RISK ({riskScore.toFixed(1)}/100)
              </span>
            </div>
            <h3 className="text-xl font-bold text-text-main">Transaction Investigation Dossier</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-subtle text-taupe hover:text-text-main transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 py-6 space-y-6 overflow-y-auto">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-surface-subtle border border-taupe/15">
              <span className="text-[11px] text-taupe block">Amount</span>
              <span className="font-tabular font-bold text-lg text-text-main">
                ₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface-subtle border border-taupe/15">
              <span className="text-[11px] text-taupe block">Historical Baseline</span>
              <span className="font-tabular font-medium text-sm text-charcoal">
                ₹{transaction.user_historical_mean.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-accent block font-mono">
                {transaction.amount_to_mean_ratio}x user mean
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface-subtle border border-taupe/15">
              <span className="text-[11px] text-taupe block">1-Hour Velocity</span>
              <span className="font-tabular font-bold text-sm text-text-main">
                {transaction.rolling_count_1h} txns
              </span>
              <span className="text-[10px] text-taupe block">
                (₹{transaction.rolling_amount_1h.toLocaleString('en-IN')})
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface-subtle border border-taupe/15">
              <span className="text-[11px] text-taupe block">Time Delta</span>
              <span className="font-tabular font-medium text-sm text-text-main">
                {transaction.time_since_last_txn_sec < 60
                  ? `${transaction.time_since_last_txn_sec.toFixed(0)}s`
                  : `${(transaction.time_since_last_txn_sec / 60).toFixed(1)}m`}
              </span>
            </div>
          </div>

          {/* Transfer Flow */}
          <div className="p-4 rounded-xl bg-background border border-taupe/20">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-taupe mb-3">
              Participant Relationship
            </h4>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface border border-taupe/30 flex items-center justify-center text-charcoal">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-taupe block">Sender</span>
                  <span className="font-semibold text-sm text-text-main">{transaction.sender_name}</span>
                  <span className="text-[10px] font-mono text-taupe block">{transaction.sender_id}</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <ArrowRight className="w-5 h-5 text-accent" />
                <span className="text-[10px] font-mono text-taupe">{transaction.channel}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface border border-taupe/30 flex items-center justify-center text-accent">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-taupe block">
                    {transaction.receiver_type === 'merchant' ? 'Merchant' : 'Beneficiary'}
                  </span>
                  <span className="font-semibold text-sm text-text-main">{transaction.receiver_name}</span>
                  <span className="text-[10px] font-mono text-taupe block">
                    {transaction.merchant_category.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contextual Flags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-surface-subtle border border-taupe/15 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-accent mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-text-main block">Geographic Location</span>
                <span className="text-xs text-charcoal">{transaction.location_city}</span>
                {transaction.is_location_changed && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-alert/15 text-alert">
                    Abrupt City Hop Detected
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle border border-taupe/15 flex items-start gap-3">
              <Smartphone className="w-4 h-4 text-accent mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-text-main block">Device & Channel</span>
                <span className="text-xs text-charcoal">
                  {transaction.device_type} • {transaction.device_id}
                </span>
                {transaction.is_device_changed && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-alert/15 text-alert">
                    New Device Fingerprint
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Multi-Method Detection Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-taupe">
              Detection Method Signals
            </h4>

            {/* Method 1: IQR */}
            <div className="p-3 rounded-xl bg-surface-subtle border border-taupe/15 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-main">Method 1: IQR Outlier Test</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    transaction.detection?.iqr_flag ? 'bg-alert/15 text-alert' : 'bg-taupe/15 text-taupe'
                  }`}
                >
                  {transaction.detection?.iqr_flag ? 'FLAGGED OUTLIER' : 'NORMAL RANGE'}
                </span>
              </div>
              <p className="text-[11px] text-taupe leading-relaxed">
                {transaction.detection?.iqr_reason || 'Transaction amount is within the expected IQR envelope.'}
              </p>
            </div>

            {/* Method 2: Isolation Forest */}
            <div className="p-3 rounded-xl bg-surface-subtle border border-taupe/15 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-main">Method 2: Isolation Forest</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    transaction.detection?.iforest_flag ? 'bg-alert/15 text-alert' : 'bg-taupe/15 text-taupe'
                  }`}
                >
                  {transaction.detection?.iforest_flag
                    ? `FLAGGED (Score: ${transaction.detection.iforest_score})`
                    : 'INLIER'}
                </span>
              </div>
              <p className="text-[11px] text-taupe leading-relaxed">
                {transaction.detection?.iforest_reason || 'Multi-feature isolation trees did not isolate this record.'}
              </p>
            </div>

            {/* Method 3: Time Series */}
            <div className="p-3 rounded-xl bg-surface-subtle border border-taupe/15 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-main">
                  Method 3: Time-Series & Velocity Bursts
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    transaction.detection?.timeseries_flag ? 'bg-alert/15 text-alert' : 'bg-taupe/15 text-taupe'
                  }`}
                >
                  {transaction.detection?.timeseries_flag ? 'VELOCITY BREACH' : 'BASELINE CONGRUENT'}
                </span>
              </div>
              <p className="text-[11px] text-taupe leading-relaxed">
                {transaction.detection?.timeseries_reason ||
                  'No velocity anomaly or extreme baseline deviation observed.'}
              </p>
            </div>
          </div>

          {/* Ground Truth Validation Note (Separate) */}
          <div className="p-3 rounded-xl bg-taupe/10 border border-taupe/20 text-xs">
            <span className="text-[11px] font-semibold text-charcoal block mb-0.5">
              Ground-Truth Audit Label (Independent Simulation):
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  transaction.is_fraud_simulated
                    ? 'bg-alert text-white'
                    : 'bg-sage text-white'
                }`}
              >
                {transaction.is_fraud_simulated ? 'SIMULATED FRAUD' : 'SIMULATED LEGITIMATE'}
              </span>
              <span className="font-mono text-[11px] text-taupe">
                Scenario Tag: {transaction.fraud_scenario_tag}
              </span>
            </div>
          </div>

          {/* Interactive Analyst Review Section */}
          <div className="p-4 rounded-xl bg-surface border border-accent/30 space-y-4 shadow-soft">
            <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-accent" />
              Investigation Decision & Analyst Notes
            </h4>

            <div>
              <label className="text-xs font-medium text-charcoal block mb-1">
                Investigation Status:
              </label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-lg bg-surface-subtle border border-taupe/30 text-text-main focus:outline-none focus:border-accent"
              >
                <option value="New">New (Unassigned)</option>
                <option value="Under Review">Under Review (Analyst Assigned)</option>
                <option value="Reviewed">Reviewed (Cleared Legitimate)</option>
                <option value="Escalated">Escalated (Tier 2 Fraud Operations)</option>
                <option value="Closed">Closed (Resolved & Dismissed)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-charcoal block mb-1">
                Analyst Notes / Rationale:
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Document verification steps, customer contact outcome, or evidence for escalation..."
                className="w-full text-xs sm:text-sm p-2.5 rounded-lg bg-surface-subtle border border-taupe/30 text-text-main placeholder-taupe/60 focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {saveSuccess && (
                <span className="text-xs text-sage font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Changes saved to PostgreSQL
                </span>
              )}
              {!saveSuccess && <span />}

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Update Investigation Record'}
              </button>
            </div>
          </div>

          {/* Audit Trail & Event Timeline */}
          <div className="p-4 rounded-xl bg-surface border border-taupe/20 space-y-3 shadow-soft">
            <div className="flex items-center justify-between pb-2 border-b border-taupe/15">
              <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5 uppercase tracking-wider font-mono">
                <History className="w-3.5 h-3.5 text-accent" />
                Audit Trail & Historical Actions ({auditEvents.length})
              </h4>
              <span className="text-[10px] text-taupe font-mono">Immutable Ledger</span>
            </div>

            {isLoadingAudit ? (
              <div className="py-4 text-center text-xs text-taupe">Loading audit events...</div>
            ) : auditEvents.length === 0 ? (
              <p className="text-xs text-taupe italic py-2">
                No previous audit updates recorded for this record yet. Any updates to status or notes are permanently captured.
              </p>
            ) : (
              <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-taupe/25">
                {auditEvents.map((evt) => (
                  <div key={evt.id} className="relative text-xs space-y-1">
                    <span className="absolute -left-4 top-1.5 w-2 h-2 rounded-full bg-accent ring-2 ring-surface" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-main flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/15 text-accent-dark">
                          {evt.action}
                        </span>
                        {evt.previous_status && evt.new_status && (
                          <span className="text-[11px] text-charcoal">
                            {evt.previous_status} → <span className="font-bold">{evt.new_status}</span>
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] font-mono text-taupe">
                        {new Date(evt.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {evt.details && (
                      <p className="text-[11px] text-taupe/90 bg-surface-subtle p-2 rounded border border-taupe/15">
                        "{evt.details}"
                      </p>
                    )}
                    <div className="text-[10px] text-taupe font-mono flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-taupe" />
                      <span>{evt.analyst_name || evt.analyst_id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
