import React from 'react';
import { Link } from 'react-router-dom';
import { NetworkHero3D } from '../components/NetworkHero3D';
import {
  ShieldAlert,
  ArrowRight,
  Database,
  Layers,
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  BarChart2,
  Lock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-semibold">
              <img src="/brand-icon.jpg" alt="Icon" className="w-4 h-4 rounded-full object-cover" />
              FINTECH RISK ANALYTICS PORTFOLIO
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-main font-editorial leading-[1.08]">
              See the Signals Behind Suspicious Transactions.
            </h1>

            <p className="text-base sm:text-lg text-charcoal/80 max-w-xl font-normal leading-relaxed">
              An analytical intelligence platform for exploring transaction behavior, detecting anomalies,
              and understanding financial risk across synthetic UPI payment networks.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent-dark text-white font-semibold text-sm transition-all shadow-soft"
              >
                <span>Explore Analytics</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/methodology"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface border border-taupe/30 hover:border-charcoal/40 text-charcoal font-semibold text-sm transition-all"
              >
                <span>View Methodology</span>
              </Link>
            </div>

            {/* Demonstration Key Metric Badges */}
            <div className="pt-6 border-t border-taupe/20 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[11px] text-taupe block uppercase font-mono">Analyzed Dataset</span>
                <span className="text-xl font-bold font-tabular text-text-main">12,423</span>
                <span className="text-[10px] text-taupe block">UPI Transactions</span>
              </div>
              <div>
                <span className="text-[11px] text-taupe block uppercase font-mono">Gross Volume</span>
                <span className="text-xl font-bold font-tabular text-text-main">₹57.8M</span>
                <span className="text-[10px] text-taupe block">Synthetic Settlements</span>
              </div>
              <div>
                <span className="text-[11px] text-taupe block uppercase font-mono">Detection Lab</span>
                <span className="text-xl font-bold font-tabular text-text-main">3 Models</span>
                <span className="text-[10px] text-taupe block">IQR • IForest • Velocity</span>
              </div>
              <div>
                <span className="text-[11px] text-taupe block uppercase font-mono">SQL Insights</span>
                <span className="text-xl font-bold font-tabular text-text-main">20+ Queries</span>
                <span className="text-[10px] text-taupe block">PostgreSQL Production</span>
              </div>
            </div>
          </div>

          {/* Hero Right 3D Visual */}
          <div className="lg:col-span-5">
            <NetworkHero3D />
          </div>
        </div>
      </section>

      {/* Detection Methods Section */}
      <section className="space-y-8">
        <div className="max-w-2xl">
          <span className="text-xs uppercase font-mono font-bold text-accent tracking-wider block">
            ANALYTICAL RIGOR
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-main font-editorial mt-1">
            Three Distinct Detection Paradigms
          </h2>
          <p className="text-sm text-charcoal/80 mt-2">
            The platform avoids single-point heuristics by benchmarking three independent statistical
            and machine-learning algorithms before synthesizing an ensemble risk score.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-surface border border-taupe/20 shadow-soft hover:shadow-elevated transition-shadow space-y-4">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
              01
            </div>
            <h3 className="font-bold text-lg text-text-main">IQR Outlier Detection</h3>
            <p className="text-xs text-charcoal/80 leading-relaxed">
              Computes nonparametric interquartile spreads ($IQR = Q_3 - Q_1$). Unmasks extreme upper-tail
              outliers breaching the $Q_3 + 1.5 \times IQR$ boundary without assuming a normal Gaussian curve.
            </p>
            <div className="pt-2 border-t border-taupe/15 flex items-center justify-between text-[11px] font-mono text-taupe">
              <span>Param: Multiplier [1.5x - 3.0x]</span>
              <span className="text-accent">Univariate</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-surface border border-taupe/20 shadow-soft hover:shadow-elevated transition-shadow space-y-4">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
              02
            </div>
            <h3 className="font-bold text-lg text-text-main">Scikit-Learn Isolation Forest</h3>
            <p className="text-xs text-charcoal/80 leading-relaxed">
              Constructs an ensemble of isolation trees across multidimensional features including amount,
              1-hour velocity count, amount-to-mean ratio, and inter-transaction seconds.
            </p>
            <div className="pt-2 border-t border-taupe/15 flex items-center justify-between text-[11px] font-mono text-taupe">
              <span>Param: Contamination [3.5%]</span>
              <span className="text-accent">Multivariate</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-surface border border-taupe/20 shadow-soft hover:shadow-elevated transition-shadow space-y-4">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
              03
            </div>
            <h3 className="font-bold text-lg text-text-main">Rolling Time-Series Velocity</h3>
            <p className="text-xs text-charcoal/80 leading-relaxed">
              Monitors individual historical baselines without future lookahead leakage. Flags rapid burst
              funneling, sudden midnight hops, and physical impossible travel windows.
            </p>
            <div className="pt-2 border-t border-taupe/15 flex items-center justify-between text-[11px] font-mono text-taupe">
              <span>Param: $Z \ge 3.0\sigma$ & Burst</span>
              <span className="text-accent">Sequential</span>
            </div>
          </div>
        </div>
      </section>

      {/* Business Impact Section Preview */}
      <section className="p-8 sm:p-10 rounded-2xl bg-surface border border-taupe/20 shadow-elevated grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <span className="text-xs uppercase font-mono font-bold text-accent tracking-wider block">
            DECISION SUPPORT & FINANCIAL MODELING
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-main font-editorial">
            Connecting Anomaly Detection to Business Economics
          </h2>
          <p className="text-sm text-charcoal/80 leading-relaxed">
            In production fintech environments, detecting 100% of anomalies is counterproductive if investigator
            overhead explodes. Our Business Impact model simulates the tradeoff between false-positive triage
            expenses and averted fraud losses across threshold sensitivity curves.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-charcoal">
              <CheckCircle2 className="w-4 h-4 text-sage" />
              <span>Configurable Cost per Investigation (₹350)</span>
            </div>
            <div className="flex items-center gap-1.5 text-charcoal">
              <CheckCircle2 className="w-4 h-4 text-sage" />
              <span>Loss Recovery Rate Parameterization (85%)</span>
            </div>
          </div>
          <div className="pt-3">
            <Link
              to="/business-impact"
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-dark transition-colors"
            >
              <span>Explore Interactive Financial Model</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 p-5 rounded-xl bg-background border border-taupe/25 space-y-3 font-mono text-xs">
          <div className="text-[11px] text-taupe pb-2 border-b border-taupe/20 flex justify-between">
            <span>FINANCIAL FORMULA</span>
            <span className="text-accent font-bold">NET BENEFIT</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-charcoal/90">
            <p className="text-sage font-semibold">+ Estimated Loss Avoided (₹)</p>
            <p className="text-alert font-semibold">- Total Investigation Costs (Alerts × ₹350)</p>
            <p className="text-taupe font-semibold">- Residual Missed Fraud Losses</p>
            <div className="pt-2 border-t border-taupe/20 text-text-main font-bold text-sm">
              = Operational Net Financial Benefit
            </div>
          </div>
        </div>
      </section>

      {/* SQL Insights Teaser */}
      <section className="p-8 rounded-2xl bg-charcoal text-surface border border-charcoal space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-mono text-accent font-bold">SQL MASTERY</span>
            <h2 className="text-2xl font-bold text-surface font-editorial mt-0.5">
              20+ Production PostgreSQL Analytical Queries
            </h2>
          </div>
          <Link
            to="/sql-insights"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-dark text-white text-xs font-semibold self-start sm:self-auto transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Open SQL Query Studio</span>
          </Link>
        </div>
        <p className="text-xs sm:text-sm text-surface/75 max-w-3xl leading-relaxed">
          The database is a central analytical component. Our SQL Studio executes live window functions,
          percentile distributions, syndicate receiver grouping, and period-over-period risk drift against the
          active database instance with sub-millisecond execution telemetry.
        </p>
      </section>

      {/* Responsible-Use Disclaimer */}
      <section className="p-6 rounded-xl bg-surface border border-taupe/25 flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-accent shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-charcoal/80 leading-relaxed">
          <h4 className="font-bold text-text-main text-sm">Responsible-Use & Portfolio Disclaimer</h4>
          <p>
            This platform is an educational decision-support analytics system built with synthetic UPI transactions.
            An anomaly flag indicates statistical departure for analyst prioritization, not confirmed fraud.
            Synthetic evaluation metrics illustrate algorithmic behavior and should not be construed as real-world
            banking operational benchmarks.
          </p>
        </div>
      </section>
    </div>
  );
};
