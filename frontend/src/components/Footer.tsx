import React from 'react';
import { Shield, AlertTriangle, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-taupe/20 bg-surface/50 mt-16 text-charcoal/80 text-xs">
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <img
                src="/brand-icon.jpg"
                alt="UPI Fraud Intelligence"
                className="w-7 h-7 rounded-lg object-cover border border-taupe/20"
              />
              <span className="font-semibold text-text-main text-sm">UPI Fraud Intelligence</span>
            </div>
            <p className="text-taupe text-[12px] leading-relaxed">
              Analytical intelligence platform for exploring transaction behavior, detecting anomalies, and quantifying financial risk.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-semibold text-text-main mb-3 text-[13px]">Analytics Modules</h4>
            <ul className="space-y-2 text-[12px]">
              <li><Link to="/dashboard" className="hover:text-accent transition-colors">Executive Dashboard</Link></li>
              <li><Link to="/transactions" className="hover:text-accent transition-colors">Transaction Explorer</Link></li>
              <li><Link to="/detection-lab" className="hover:text-accent transition-colors">Detection Lab (IQR, IForest, TS)</Link></li>
              <li><Link to="/business-impact" className="hover:text-accent transition-colors">Business Impact Analysis</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-semibold text-text-main mb-3 text-[13px]">Technical Foundations</h4>
            <ul className="space-y-2 text-[12px]">
              <li><Link to="/sql-insights" className="hover:text-accent transition-colors">20+ Analytical SQL Queries</Link></li>
              <li><Link to="/methodology" className="hover:text-accent transition-colors">Feature Engineering & Leakage</Link></li>
              <li><Link to="/methodology" className="hover:text-accent transition-colors">Synthetic Data Dictionary</Link></li>
              <li><span className="text-taupe">FastAPI + PostgreSQL + React 18</span></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-semibold text-text-main mb-3 text-[13px]">Responsible Analytics</h4>
            <div className="p-3 rounded-lg bg-surface border border-taupe/20 space-y-2 text-[11px] leading-relaxed text-taupe">
              <div className="flex items-center gap-1.5 text-accent font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Simulated Portfolio Project</span>
              </div>
              <p>
                This platform is an analytical decision-support and portfolio showcase. It uses synthetic UPI transaction patterns to demonstrate fraud detection and statistical reasoning.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-taupe/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-taupe">
          <div className="space-y-0.5 text-center sm:text-left">
            <p>© 2026 UPI Fraud Intelligence Platform. Designed for senior analytical evaluation.</p>
            <p className="text-[10px] text-taupe/90">
              Designed by <span className="font-semibold text-text-main">Pratham Singh Bisht</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 font-mono text-[10px] bg-taupe/10 px-2 py-0.5 rounded">
              <Code2 className="w-3 h-3" /> Python 3.13 / FastAPI / PostgreSQL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
