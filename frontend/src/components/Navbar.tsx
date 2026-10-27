import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3, Database, Layers, TrendingUp, Search, BookOpen,
  Sun, Moon, LogIn, LogOut, KeyRound, UserCheck, Share2, Sliders, BellRing
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, openLoginModal, openCredentialsModal, logout } = useAuth();

  const navLinks = [
    { path: '/dashboard', label: 'Overview', icon: BarChart3 },
    { path: '/transactions', label: 'Transactions', icon: Search },
    { path: '/network', label: 'Network', icon: Share2 },
    { path: '/playground', label: 'Playground', icon: Sliders },
    { path: '/alerts', label: 'Alerts', icon: BellRing },
    { path: '/detection-lab', label: 'Detection Lab', icon: Layers },
    { path: '/business-impact', label: 'Impact', icon: TrendingUp },
    { path: '/sql-insights', label: 'SQL', icon: Database },
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

        {/* Status Indicator, Auth Controls & Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Saved Dataset Credentials View Button */}
          <button
            onClick={openCredentialsModal}
            title="Inspect Saved Credentials in Dataset"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface border border-taupe/20 text-[11px] text-charcoal hover:text-accent hover:border-accent/40 shadow-soft transition-all duration-200"
          >
            <KeyRound className="w-3.5 h-3.5 text-accent" />
            <span className="font-medium">Saved Users</span>
          </button>

          {/* User Auth State / Sign In Button */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 bg-surface border border-taupe/20 rounded-xl px-2.5 py-1 shadow-soft">
              <div className="w-6 h-6 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-bold text-xs">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden xl:flex flex-col text-left leading-none">
                <span className="text-xs font-semibold text-text-main truncate max-w-[110px]">
                  {user.full_name || 'Analyst'}
                </span>
                <span className="text-[10px] text-taupe capitalize font-mono">
                  {user.provider === 'gmail' ? 'Gmail' : user.provider}
                </span>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1 rounded-lg text-taupe hover:text-alert-red hover:bg-alert-red/10 transition-colors ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-terracotta text-white font-medium text-xs tracking-wide shadow-soft transition-all duration-200"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

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
