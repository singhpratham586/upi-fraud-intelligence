import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { SavedCredentialsModal } from './components/SavedCredentialsModal';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { NetworkGraphPage } from './pages/NetworkGraphPage';
import { WhatIfPlaygroundPage } from './pages/WhatIfPlaygroundPage';
import { AlertCenterPage } from './pages/AlertCenterPage';
import { DetectionLabPage } from './pages/DetectionLabPage';
import { BusinessImpactPage } from './pages/BusinessImpactPage';
import { SQLInsightsPage } from './pages/SQLInsightsPage';
import { MethodologyPage } from './pages/MethodologyPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-background text-text-main font-sans selection:bg-accent selection:text-white transition-colors duration-200 overflow-x-hidden w-full">
            <Navbar />
            <main className="flex-1 w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 py-5 sm:py-7">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/network" element={<NetworkGraphPage />} />
                <Route path="/playground" element={<WhatIfPlaygroundPage />} />
                <Route path="/alerts" element={<AlertCenterPage />} />
                <Route path="/detection-lab" element={<DetectionLabPage />} />
                <Route path="/business-impact" element={<BusinessImpactPage />} />
                <Route path="/sql-insights" element={<SQLInsightsPage />} />
                <Route path="/methodology" element={<MethodologyPage />} />
              </Routes>
            </main>
            <Footer />
            <LoginModal />
            <SavedCredentialsModal />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
