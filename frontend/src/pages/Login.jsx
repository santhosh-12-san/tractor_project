import React, { useState } from 'react';
import { Tractor, Lock, Mail, User, Phone, MapPin } from 'lucide-react';
import { api } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Owner'); // Owner or Customer

  // Customer Profile states (only for Customer role signup)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerVillage, setCustomerVillage] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await api.login(username, password);
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Please fill in username, email and password');
      return;
    }
    if (role === 'Customer' && (!customerName || !customerPhone || !customerVillage)) {
      setError('Please fill in all customer profile details (Name, Phone, Village)');
      return;
    }

    setError('');
    setLoading(true);

    const payload = {
      username,
      email,
      password,
      role,
      ...(role === 'Customer' && {
        name: customerName,
        phone: customerPhone,
        village: customerVillage
      })
    };

    try {
      const data = await api.register(payload);
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      if (err.response && err.response.data) {
        const errors = err.response.data;
        if (errors.username) {
          setError(errors.username[0]);
        } else if (errors.phone) {
          setError(errors.phone[0]);
        } else if (errors.detail) {
          setError(errors.detail);
        } else {
          setError('Signup failed. Ensure details are correct and phone/username is unique.');
        }
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('Owner');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerVillage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden my-8">
        {/* Header Branding */}
        <div className="bg-[#0B3B24] p-8 text-center text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-800 rounded-full filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
            <Tractor className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Yogananda</h1>
          <p className="text-green-300 text-xs font-semibold tracking-wider uppercase mt-0.5">Tractor Works</p>
        </div>

        {/* Form Container */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-1">
            {isSignUp ? 'Create a new account' : 'Login to your account'}
          </h2>
          <p className="text-gray-500 text-sm text-center mb-6">
            {isSignUp ? 'Fill in details to set up your account' : 'Enter your credentials below to access TWMS'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          {!isSignUp ? (
            // Login Form
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number / Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all text-sm"
                    placeholder="e.g. owner or 9988776655"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mr-2"
                    defaultChecked
                  />
                  Remember me
                </label>
                <a href="#" className="font-semibold text-green-700 hover:text-green-800 transition-colors">
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#0B3B24] hover:bg-[#08291a] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          ) : (
            // Signup Form
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="Create a username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="owner@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Account Role Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('Owner')}
                    className={`py-2 px-3 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                      role === 'Owner' 
                        ? 'bg-[#0B3B24] text-white border-transparent shadow-sm' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    System Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Customer')}
                    className={`py-2 px-3 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                      role === 'Customer' 
                        ? 'bg-[#0B3B24] text-white border-transparent shadow-sm' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Customer Account
                  </button>
                </div>
              </div>

              {/* Customer Profile inputs */}
              {role === 'Customer' && (
                <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Customer Profile Details</p>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <User className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg bg-white text-xs"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number *</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                          <Phone className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg bg-white text-xs"
                          placeholder="Your phone"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Village *</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                          <MapPin className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="text"
                          required
                          value={customerVillage}
                          onChange={(e) => setCustomerVillage(e.target.value)}
                          className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg bg-white text-xs"
                          placeholder="Village"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-[#0B3B24] hover:bg-[#08291a] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {loading ? 'Setting up account...' : 'Sign up'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center text-sm text-gray-500 border-t border-gray-100 pt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={toggleMode}
              className="font-semibold text-green-700 hover:text-green-800 transition-colors cursor-pointer"
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
