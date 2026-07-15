import React, { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, AlertCircle, Fuel, Settings2, ArrowUpRight, TrendingUp, Tractor } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../services/api';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard({ setPage }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  // --- RENDER CUSTOMER PORTAL DASHBOARD ---
  if (stats && stats.role === 'Customer') {
    const customerStats = [
      { title: 'Total Bookings', value: stats.total_bookings, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
      { title: "Today's Bookings", value: stats.todays_bookings, icon: Tractor, color: 'text-indigo-600 bg-indigo-50' },
      { title: 'Total Paid', value: `₹ ${(stats.total_paid || 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
      { title: 'Pending Balance', value: `₹ ${(stats.pending_payments || 0).toLocaleString()}`, icon: AlertCircle, color: 'text-red-600 bg-red-50' },
    ];

    return (
      <div className="space-y-6">
        {/* Welcome greeting */}
        <div className="bg-[#0B3B24] rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-48 h-48 bg-green-800 rounded-full filter blur-3xl opacity-30 -mr-16 -mt-16"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold">Welcome back to your TWMS Portal!</h2>
              <p className="text-green-200 text-sm mt-1">Manage your tractor service requests, track schedules, and review invoice details.</p>
            </div>
            <button
              onClick={() => setPage('bookings')}
              className="px-4 py-2.5 bg-white text-green-900 font-bold rounded-xl text-sm hover:bg-green-50 shadow transition-colors cursor-pointer"
            >
              Request Booking
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {customerStats.map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Bookings Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">My Recent Bookings</h3>
              <p className="text-gray-400 text-sm">Status of your latest service requests</p>
            </div>
            <button 
              onClick={() => setPage('bookings')}
              className="flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors cursor-pointer"
            >
              View All Bookings
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          {(!stats.recent_bookings || stats.recent_bookings.length === 0) ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No recent bookings registered yet. Click "Request Booking" to schedule a job!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Work Type</th>
                    <th className="py-3 px-4">Acres / Hours</th>
                    <th className="py-3 px-4">Est. Cost</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_bookings.map((booking, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors text-sm text-gray-700">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">{booking.date}</td>
                      <td className="py-3.5 px-4">{booking.work_type}</td>
                      <td className="py-3.5 px-4">{booking.acres_hours}</td>
                      <td className="py-3.5 px-4">₹ {(parseFloat(booking.total_amount) || 0).toLocaleString()}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          booking.status === 'Completed' ? 'bg-green-50 text-green-700' :
                          booking.status === 'In Progress' ? 'bg-amber-50 text-amber-700' :
                          booking.status === 'Canceled' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER OWNER PORTAL DASHBOARD ---
  const statCards = [
    { title: 'Total Customers', value: stats.total_customers, change: '+12 This Month', icon: Users, color: 'text-blue-600 bg-blue-50' },
    { title: "Today's Bookings", value: stats.todays_bookings, change: '+2 New', icon: Calendar, color: 'text-indigo-600 bg-indigo-50' },
    { title: "Today's Earnings", value: `₹ ${stats.todays_earnings.toLocaleString()}`, change: '+18%', icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { title: 'Pending Payments', value: `₹ ${stats.pending_payments.toLocaleString()}`, change: '+6%', icon: AlertCircle, color: 'text-red-600 bg-red-50' },
    { title: 'Fuel Expense (This Month)', value: `₹ ${stats.fuel_expense.toLocaleString()}`, change: 'Regular use', icon: Fuel, color: 'text-amber-600 bg-amber-50' },
    { title: 'Maintenance Expense', value: `₹ ${stats.maintenance_expense.toLocaleString()}`, change: 'Due check', icon: Settings2, color: 'text-purple-600 bg-purple-50' },
    { title: 'Total Income (This Month)', value: `₹ ${stats.total_income.toLocaleString()}`, change: 'Target 1.5L', icon: DollarSign, color: 'text-teal-600 bg-teal-50' },
    { title: 'Profit (This Month)', value: `₹ ${stats.profit.toLocaleString()}`, change: 'Net earnings', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1">
              <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{card.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income Overview Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Income Overview</h3>
              <p className="text-gray-400 text-sm">Earnings progression over the last 7 days</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.income_overview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value) => [`₹ ${value}`, 'Earnings']} />
                <Area type="monotone" dataKey="earnings" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Work Types Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Top Work Types</h3>
            <p className="text-gray-400 text-sm mb-4">Distribution of booking types</p>
          </div>
          {(!stats.work_types || stats.work_types.length === 0) ? (
            <div className="text-center py-12 text-gray-400 text-sm flex-1 flex items-center justify-center">
              No booking work type stats recorded yet.
            </div>
          ) : (
            <>
              <div className="h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.work_types}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.work_types.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-gray-800">TWMS</span>
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Bookings</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                {stats.work_types.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="text-gray-600 truncate">{item.name} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Bookings Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Recent Bookings</h3>
            <p className="text-gray-400 text-sm">Last bookings processed today</p>
          </div>
          <button 
            onClick={() => setPage('bookings')}
            className="flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors cursor-pointer"
          >
            View All Bookings
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
        {(!stats.recent_bookings || stats.recent_bookings.length === 0) ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No bookings registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Work Type</th>
                  <th className="py-3 px-4">Acres/Hours</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_bookings.map((booking, idx) => (
                  <tr key={idx} className="border-b border-gray-55 hover:bg-gray-50/50 transition-colors text-sm text-gray-700">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{booking.customer_name}</td>
                    <td className="py-3.5 px-4">{booking.work_type}</td>
                    <td className="py-3.5 px-4">{booking.acres_hours}</td>
                    <td className="py-3.5 px-4 text-gray-500">{booking.date}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        booking.status === 'Completed' ? 'bg-green-50 text-green-700' :
                        booking.status === 'In Progress' ? 'bg-amber-50 text-amber-700' :
                        booking.status === 'Canceled' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
