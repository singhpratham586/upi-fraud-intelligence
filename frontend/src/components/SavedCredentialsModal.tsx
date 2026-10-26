import React, { useEffect, useState } from 'react';
import { X, Database, RefreshCw, KeyRound, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { StoredCredentialRecord } from '../types';

export const SavedCredentialsModal: React.FC = () => {
  const { isCredentialsModalOpen, closeCredentialsModal } = useAuth();
  const [users, setUsers] = useState<StoredCredentialRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSavedUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch saved user credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCredentialsModalOpen) {
      fetchUsers();
    }
  }, [isCredentialsModalOpen]);

  if (!isCredentialsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-surface border border-taupe/25 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-taupe/15 bg-background/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/10 border border-accent/25 text-accent">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-text-main flex items-center gap-2">
                Saved User Credentials & Dataset Log
                <span className="text-[10px] font-mono uppercase bg-sage text-white px-1.5 py-0.5 rounded font-bold">
                  LIVE DB
                </span>
              </h3>
              <p className="text-xs text-taupe">Persisted records in the PostgreSQL / SQLite database table: <code className="text-accent font-mono">users</code></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              title="Refresh Dataset Records"
              className="p-1.5 rounded-lg border border-taupe/20 bg-surface text-charcoal hover:text-accent hover:border-accent transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={closeCredentialsModal}
              className="p-1.5 rounded-lg text-taupe hover:text-text-main hover:bg-surface/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-taupe">
            <span>
              Total Saved Accounts: <strong className="text-text-main font-mono">{users.length}</strong>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-sage">
              <CheckCircle className="w-3.5 h-3.5" />
              Credentials active & queryable in SQL Insights
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-alert-red/10 border border-alert-red/30 text-alert-red text-xs">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="border border-taupe/20 rounded-xl overflow-x-auto bg-background/50">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/80 border-b border-taupe/20 font-mono text-[11px] text-taupe">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Credential Hash / Token</th>
                  <th className="py-2.5 px-3">Logins</th>
                  <th className="py-2.5 px-3">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-taupe/15">
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-taupe">
                      No user credentials saved yet. Sign in with Gmail, Google, or GitHub to record credentials.
                    </td>
                  </tr>
                )}
                {users.map((u) => {
                  const isGmail = u.provider === 'gmail';
                  const isGoogle = u.provider === 'google';
                  const isGitHub = u.provider === 'github';

                  return (
                    <tr key={u.id} className="hover:bg-surface/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-taupe">#{u.id}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-text-main">{u.email}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                            isGmail
                              ? 'bg-accent/15 text-accent border border-accent/30'
                              : isGoogle
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                              : 'bg-charcoal/15 text-charcoal dark:text-cream border border-charcoal/30'
                          }`}
                        >
                          {isGmail ? 'Gmail (Primary)' : isGoogle ? 'Google OAuth' : 'GitHub OAuth'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-charcoal">{u.full_name}</td>
                      <td className="py-2.5 px-3 text-taupe flex items-center gap-1">
                        <Shield className="w-3 h-3 text-sage" />
                        {u.role}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-taupe">
                        <span className="flex items-center gap-1 bg-surface px-1.5 py-0.5 rounded border border-taupe/20">
                          <KeyRound className="w-3 h-3 text-accent" />
                          {u.password_hint}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-center text-text-main">{u.login_count}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-taupe whitespace-nowrap">
                        {new Date(u.last_login_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-taupe/15 bg-background/50 flex items-center justify-between">
          <span className="text-[11px] text-taupe">
            SQL verification: <code className="text-accent font-mono">SELECT * FROM users ORDER BY last_login_at DESC;</code>
          </span>
          <button
            onClick={closeCredentialsModal}
            className="px-4 py-1.5 rounded-xl bg-charcoal text-surface text-xs font-medium hover:bg-charcoal/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
