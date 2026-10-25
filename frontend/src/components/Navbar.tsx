import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Database, Layers, TrendingUp, Search, BookOpen, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { path: '/dashboard', label: 'Overview', icon: BarChart3 },
    { path: '/transactions', label: 'Transactions', icon: Search },
    { path: '/detection-lab', label: 'Detection Lab', icon: Layers },
    { path: '/business-impact', label: 'Business Impact', icon: TrendingUp },
    { path: '/sql-insights', label: 'SQL Insights', icon: Database },
    { path: '/methodology', label: 'Methodology', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-taupe/20 bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/brand-icon.jpg"
            alt="UPI Fraud Intelligence Logo"
            className="w-9 h-9 rounded-xl object-cover shadow-soft border border-taupe/25 group-hover:border-accent transition-colors duration-200"
          />
          <div>
            <span className="font-semibold text-sm sm:text-base tracking-tight text-text-main flex items-center gap-1.5">
              UPI Fraud Intelligence
              <span className="text-[10px] font-mono uppercase bg-accent/10 text-accent px-1.5 py-0.5 rounded font-bold">
                PROD
              </span>
            </span>
            <span className="hidden sm:block text-[11px] text-taupe leading-none">
              Transaction Risk Analytics Platform
            </span>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-charcoal text-surface shadow-soft'
                    : 'text-charcoal/80 hover:text-text-main hover:bg-surface/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Status Indicator & Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl bg-surface border border-taupe/20 text-charcoal hover:text-accent hover:border-accent/40 shadow-soft transition-all duration-200"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-accent animate-in fade-in zoom-in-75 duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-charcoal animate-in fade-in zoom-in-75 duration-200" />
            )}
          </button>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface border border-taupe/20 text-[11px] text-charcoal font-medium shadow-soft">
            <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />
            <span>PostgreSQL Active</span>
          </div>
          <Link
            to="/transactions"
            className="md:hidden p-2 rounded-xl bg-surface border border-taupe/20 text-charcoal shadow-soft"
            title="Transactions"
          >
            <Search className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
