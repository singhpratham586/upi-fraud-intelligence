import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, ShieldCheck, Sparkles, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, loginWithGmail, loginWithOAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleGmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMsg(null);

    let cleanEmail = email.trim();
    if (!cleanEmail) {
      setAuthError('Please enter your email address.');
      return;
    }
    if (!cleanEmail.includes('@')) {
      cleanEmail += '@gmail.com';
      setEmail(cleanEmail);
    }

    if (password.length < 4) {
      setAuthError('Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithGmail(cleanEmail, password, fullName.trim() || undefined);
      setSuccessMsg(res.message);
      setTimeout(() => {
        closeLoginModal();
      }, 700);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to authenticate with Gmail credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const sampleEmail = email.trim() && email.includes('@') ? email.trim() : 'lead.analyst@gmail.com';
      const sampleName = fullName.trim() || 'Senior Risk Analyst';
      const res = await loginWithOAuth(
        'google',
        sampleEmail,
        sampleName,
        'https://api.dicebear.com/7.x/initials/svg?seed=Google%20Analyst'
      );
      setSuccessMsg(res.message);
      setTimeout(() => {
        closeLoginModal();
      }, 700);
    } catch (err: any) {
      setAuthError(err.message || 'Google OAuth failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubOAuth = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const sampleEmail = 'singhpratham586@users.noreply.github.com';
      const sampleName = 'Pratham Singh (GitHub)';
      const res = await loginWithOAuth(
        'github',
        sampleEmail,
        sampleName,
        'https://avatars.githubusercontent.com/u/146931839?v=4'
      );
      setSuccessMsg(res.message);
      setTimeout(() => {
        closeLoginModal();
      }, 700);
    } catch (err: any) {
      setAuthError(err.message || 'GitHub OAuth failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const autofillDemoAnalyst = () => {
    setEmail('analyst@gmail.com');
    setPassword('analyst123');
    setFullName('Lead Risk Analyst');
    setAuthError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-surface border border-taupe/25 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-taupe/15 bg-background/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/10 border border-accent/25 text-accent">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-text-main flex items-center gap-2">
                Analyst Sign In
                <span className="text-[10px] font-mono uppercase bg-accent text-white px-1.5 py-0.5 rounded font-bold">
                  SECURE
                </span>
              </h3>
              <p className="text-xs text-taupe">Access forensic intelligence & dataset logs</p>
            </div>
          </div>
          <button
            onClick={closeLoginModal}
            className="p-1.5 rounded-lg text-taupe hover:text-text-main hover:bg-surface/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Alerts */}
          {authError && (
            <div className="p-3 rounded-xl bg-alert-red/10 border border-alert-red/30 flex items-center gap-2 text-alert-red text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-sage/15 border border-sage/40 flex items-center gap-2 text-sage text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* PRIMARY AUTHENTICATION: GMAIL */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Primary Authentication
              </span>
              <button
                type="button"
                onClick={autofillDemoAnalyst}
                className="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium"
              >
                <Sparkles className="w-3 h-3" />
                Fill Demo Credentials
              </button>
            </div>

            <form onSubmit={handleGmailSubmit} className="space-y-3.5">
              {/* Full Name (optional) */}
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">
                  Analyst Name <span className="text-taupe text-[10px]">(Optional for first-time login)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-taupe" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Lead Risk Officer"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-taupe/25 text-text-main focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              {/* Gmail / Email */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-charcoal flex items-center gap-1">
                    Gmail Address
                    <span className="text-alert-red">*</span>
                  </label>
                  {!email.includes('@') && email.trim() && (
                    <button
                      type="button"
                      onClick={() => setEmail(`${email.trim()}@gmail.com`)}
                      className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded font-mono hover:bg-accent/20 transition-colors"
                    >
                      + @gmail.com
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-taupe" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="username@gmail.com"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-taupe/25 text-text-main focus:outline-none focus:border-accent font-mono transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">
                  Password <span className="text-alert-red">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-taupe" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-xl bg-background border border-taupe/25 text-text-main focus:outline-none focus:border-accent font-mono transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-taupe hover:text-text-main"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Gmail Sign In CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-accent hover:bg-terracotta text-white font-medium text-xs tracking-wide shadow-soft flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Sign In with Gmail</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* DIVIDER */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-taupe/20" />
            <span className="absolute px-3 bg-surface text-[10px] uppercase font-mono tracking-wider text-taupe">
              Or continue with
            </span>
          </div>

          {/* OAUTH BUTTONS */}
          <div className="grid grid-cols-2 gap-3">
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleOAuth}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-background border border-taupe/25 hover:border-accent text-text-main text-xs font-medium shadow-soft hover:bg-surface transition-all duration-150 disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google</span>
            </button>

            {/* GitHub OAuth Button */}
            <button
              type="button"
              onClick={handleGithubOAuth}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-background border border-taupe/25 hover:border-accent text-text-main text-xs font-medium shadow-soft hover:bg-surface transition-all duration-150 disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0 fill-current text-charcoal" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          {/* DATA PERSISTENCE NOTICE */}
          <div className="p-3 rounded-xl bg-background/80 border border-taupe/20 text-[11px] text-taupe flex items-start gap-2">
            <Database className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
            <span>
              <strong className="text-charcoal font-medium">Dataset Persistence:</strong> Your credentials, role, and
              login timestamps are recorded in the active database table (<code className="text-accent font-mono">users</code>).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
