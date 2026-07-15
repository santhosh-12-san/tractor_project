import React, { useState, useEffect } from 'react';
import { 
  Tractor, LayoutDashboard, Users, Calendar, ShieldAlert, 
  Fuel, Settings, DollarSign, Wrench, BarChart3, Settings2, 
  LogOut, Menu, X, WifiOff, RefreshCw, Layers, CheckCircle
} from 'lucide-react';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Bookings from './pages/Bookings';
import Drivers from './pages/Drivers';
import Wages from './pages/Wages';
import FuelPage from './pages/Fuel';
import Expenses from './pages/Expenses';
import Payments from './pages/Payments';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import CompletedWorks from './pages/CompletedWorks';

import { getDemoMode, setDemoMode, api, API_BASE_URL } from './services/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('twms-token') || '');
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(localStorage.getItem('twms-current-page') || 'dashboard');
  const [demoActive, setDemoActive] = useState(getDemoMode());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    localStorage.setItem('twms-current-page', page);
  };

  useEffect(() => {
    // Listen for auto-fallback to demo mode from API layer
    window.onDemoModeTriggered = (value) => {
      setDemoActive(value);
    };

    // If already tokenized, set a mock user profile based on token structure
    if (token) {
      const savedRole = api.getCurrentRole();
      const savedUsername = localStorage.getItem('twms-username') || 'owner';
      setUser({
        username: savedUsername,
        role: savedRole
      });
    }
  }, [token]);

  const handleLoginSuccess = (newToken, loggedUser) => {
    setToken(newToken);
    setUser(loggedUser);
    localStorage.setItem('twms-token', newToken);
    localStorage.setItem('twms-username', loggedUser.username);
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('twms-token');
    localStorage.removeItem('twms-role');
    localStorage.removeItem('twms-customer-profile');
    localStorage.removeItem('twms-username');
    localStorage.removeItem('twms-current-page');
  };

  const attemptReconnection = async () => {
    setReconnecting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/stats/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDemoMode(false);
        setDemoActive(false);
      } else {
        alert('Could not establish Django API connection. Keeping Demo Mode.');
      }
    } catch (e) {
      alert('Local PostgreSQL / Django server not reachable on port 8000. Double check your settings.');
    } finally {
      setReconnecting(false);
    }
  };

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const role = user?.role || 'Owner';

  // Filter menu items based on role
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users, role: 'Owner' },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'completed_works', label: 'Completed Works', icon: CheckCircle },
    { id: 'drivers', label: 'Drivers', icon: ShieldAlert, role: 'Owner' },
    { id: 'wages', label: 'Wages', icon: DollarSign, role: 'Owner' },
    { id: 'fuel', label: 'Fuel', icon: Fuel, role: 'Owner' },
    { id: 'expenses', label: 'Expenses', icon: Settings, role: 'Owner' },
    { id: 'payments', label: 'Payments', icon: Layers, role: 'Owner' },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, role: 'Owner' },
    { id: 'reports', label: 'Reports', icon: BarChart3, role: 'Owner' },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ].filter(item => !item.role || item.role === role);

  const renderActivePage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard setPage={handlePageChange} />;
      case 'customers': return <Customers />;
      case 'bookings': return <Bookings />;
      case 'drivers': return <Drivers />;
      case 'wages': return <Wages />;
      case 'fuel': return <FuelPage />;
      case 'expenses': return <Expenses />;
      case 'payments': return <Payments />;
      case 'maintenance': return <Maintenance />;
      case 'completed_works': return <CompletedWorks />;
      case 'reports': return <Reports />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard setPage={handlePageChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Demo banner if active */}
      {demoActive && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm select-none">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>Running in Demo Mode (Local PostgreSQL server is offline). Using mock data.</span>
          </div>
          <button 
            onClick={attemptReconnection}
            disabled={reconnecting}
            className="px-3 py-1 bg-white text-amber-700 rounded-lg font-bold flex items-center gap-1 hover:bg-amber-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {reconnecting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Reconnect API
          </button>
        </div>
      )}

      {/* Main Layout wrapper */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 bg-[#0B3B24] flex-col text-white z-10 shrink-0">
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <Tractor className="w-8 h-8 text-green-400" />
            <div>
              <span className="font-extrabold text-sm tracking-wide block leading-tight">Yogananda</span>
              <span className="text-[10px] text-green-300 font-semibold tracking-wider uppercase block">
                Tractor Works
              </span>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium tracking-wide transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-green-800 text-white font-bold shadow-md shadow-green-950/20' 
                      : 'text-green-100 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-300 hover:bg-red-950/20 hover:text-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              Logout
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 max-w-[80vw] h-full bg-[#0B3B24] flex flex-col text-white animate-in slide-in-from-left duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Tractor className="w-6 h-6 text-green-400" />
                  <span className="font-extrabold text-xs tracking-wide">Yogananda Tractor Works</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-green-300 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        handlePageChange(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium tracking-wide transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-green-800 text-white font-bold' 
                          : 'text-green-100 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-300 hover:bg-red-950/20 hover:text-red-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-6 z-10 shrink-0 shadow-sm">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold text-gray-800 capitalize">
                {currentPage === 'fuel' ? 'Fuel Management' : currentPage}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800 capitalize">{user?.username || 'Owner'}</p>
                <p className="text-xs text-gray-400">{role === 'Owner' ? 'System Owner' : 'Verified Customer'}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 text-green-700 font-bold rounded-xl flex items-center justify-center border border-green-200">
                {role === 'Owner' ? 'O' : 'C'}
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
            {renderActivePage()}
          </main>
        </div>
      </div>
    </div>
  );
}
