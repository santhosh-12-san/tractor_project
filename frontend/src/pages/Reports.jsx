import React, { useState, useEffect } from 'react';
import { FileText, Download, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../services/api';

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('Profit');

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.getReportsStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load reports stats', err);
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

  return (
    <div className="space-y-6">
      {/* Reports Type Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex gap-2">
          {['Profit', 'Daily Income', 'Monthly Income'].map(type => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                reportType === type 
                  ? 'bg-[#0B3B24] text-white shadow-sm' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-initial px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer transition-colors">
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button className="flex-1 sm:flex-initial px-4 py-2 bg-[#0B3B24] hover:bg-[#08291a] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors">
            <FileText className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Financial Payouts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Income</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">₹ {stats.total_income.toLocaleString()}</p>
          <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded mt-2 inline-block">Incoming</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">₹ {stats.total_expenses.toLocaleString()}</p>
          <span className="text-xs text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded mt-2 inline-block">Outgoing</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Net Profit</p>
          <p className="text-2xl font-bold text-green-700 mt-2">₹ {stats.net_profit.toLocaleString()}</p>
          <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded mt-2 inline-block">Gains</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Profit Percentage</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{stats.profit_percent}%</p>
          <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded mt-2 inline-block">Margin</span>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income overview bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Monthly Payouts</h3>
              <p className="text-gray-400 text-sm">Income analysis by calendar months</p>
            </div>
            <BarChart2 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthly_income} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value) => [`₹ ${value}`, 'Income']} />
                <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense breakdown chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Expense Breakdown</h3>
                <p className="text-gray-400 text-sm">Operational cost allocation</p>
              </div>
              <PieChartIcon className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.expense_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="amount"
                >
                  {stats.expense_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹ ${value.toLocaleString()}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-bold text-gray-800">Expenses</span>
              <span className="text-gray-400 text-xs uppercase tracking-wider">Breakdown</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            {stats.expense_breakdown.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="text-gray-600 truncate">{item.name} (₹ {item.amount.toLocaleString()})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings Performance Summary */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Operations Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Total Bookings logged</span>
            <span className="text-3xl font-extrabold text-gray-800 mt-2 block">{stats.total_bookings}</span>
          </div>
          <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
            <span className="text-green-600 text-xs font-semibold uppercase tracking-wider block">Completed Bookings</span>
            <span className="text-3xl font-extrabold text-green-700 mt-2 block">{stats.completed_bookings}</span>
          </div>
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
            <span className="text-red-600 text-xs font-semibold uppercase tracking-wider block">Canceled Bookings</span>
            <span className="text-3xl font-extrabold text-red-700 mt-2 block">{stats.canceled_bookings}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
