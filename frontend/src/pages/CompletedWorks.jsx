import React, { useState, useEffect } from 'react';
import { CheckCircle, Search, Calendar, Tractor, DollarSign, Award } from 'lucide-react';
import { api } from '../services/api';

export default function CompletedWorks() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const role = api.getCurrentRole();

  useEffect(() => {
    loadCompletedBookings();
  }, []);

  const loadCompletedBookings = async () => {
    setLoading(true);
    try {
      const data = await api.bookings.list();
      // Filter only Completed bookings
      const completed = data.filter(b => b.status === 'Completed');
      setBookings(completed);
    } catch (err) {
      console.error('Failed to load completed bookings', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = bookings.filter(b => 
    (b.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.work_type || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.driver_name || '').toLowerCase().includes(search.toLowerCase())
  );

  // Aggregate metrics
  const totalWorks = filtered.length;
  const totalAcresHours = filtered.reduce((sum, b) => sum + (parseFloat(b.acres_hours) || 0), 0);
  const totalEarnings = filtered.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-700 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Completed Works</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{totalWorks}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Tractor className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Area / Hours</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{totalAcresHours.toFixed(1)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">₹ {totalEarnings.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search completed works..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm transition-all"
          />
        </div>

        <span className="text-xs font-semibold bg-green-50 text-green-700 px-3 py-1.5 rounded-full flex items-center gap-1">
          <Award className="w-3.5 h-3.5" />
          Verified Completed Jobs Log
        </span>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Job History</h3>
          <p className="text-gray-400 text-sm">Archived history of completed bookings and finances</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No completed works found matching search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Work Type</th>
                  <th className="py-3 px-6">Driver</th>
                  <th className="py-3 px-6">Acres/Hours</th>
                  <th className="py-3 px-6">Rate</th>
                  <th className="py-3 px-6">Total Amount</th>
                  <th className="py-3 px-6">Advance Paid</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-55/30 transition-colors text-sm text-gray-700">
                    <td className="py-3.5 px-6 text-gray-500 font-medium">{booking.date}</td>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">{booking.customer_name}</td>
                    <td className="py-3.5 px-6">{booking.work_type}</td>
                    <td className="py-3.5 px-6 text-gray-600">{booking.driver_name || '-'}</td>
                    <td className="py-3.5 px-6">{booking.acres_hours}</td>
                    <td className="py-3.5 px-6 text-gray-500">₹ {booking.rate}</td>
                    <td className="py-3.5 px-6 font-bold text-gray-800">₹ {parseFloat(booking.total_amount).toLocaleString()}</td>
                    <td className="py-3.5 px-6 text-green-700 font-semibold">₹ {booking.advance}</td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">
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
