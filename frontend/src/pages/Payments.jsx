import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, X, CreditCard } from 'lucide-react';
import { api } from '../services/api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalAmount, setTotalAmount] = useState('');
  const [paid, setPaid] = useState('');
  const [mode, setMode] = useState('Cash');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [paymentsData, customersData] = await Promise.all([
        api.payments.list(),
        api.customers.list()
      ]);
      setPayments(paymentsData);
      setCustomers(customersData);
      if (customersData.length > 0) {
        setCustomer(customersData[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load payments data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!customer || !totalAmount || !paid) {
      setError('Please fill in Customer, Total, and Paid amount');
      return;
    }
    setError('');
    try {
      await api.payments.create({
        customer: parseInt(customer),
        date,
        total_amount: parseFloat(totalAmount),
        paid: parseFloat(paid),
        mode
      });
      setIsModalOpen(false);
      setTotalAmount('');
      setPaid('');
      loadData();
    } catch (err) {
      setError('Failed to log payment.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      try {
        await api.payments.delete(id);
        loadData();
      } catch (err) {
        console.error('Failed to delete payment record', err);
      }
    }
  };

  const filtered = payments.filter(p => 
    p.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPaid = filtered.reduce((sum, item) => sum + parseFloat(item.paid || 0), 0);
  const totalPending = filtered.reduce((sum, item) => sum + parseFloat(item.pending || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Received Payments</p>
            <p className="text-2xl font-bold text-green-700 mt-2">₹ {totalPaid.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-green-50 text-green-600">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Outstanding Pending</p>
            <p className="text-2xl font-bold text-red-600 mt-2">₹ {totalPending.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-red-50 text-red-600">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search payments by customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm transition-all"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#0B3B24] hover:bg-[#08291a] text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors text-sm"
        >
          <Plus className="w-5 h-5" />
          Add Payment Record
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Customer Payouts</h3>
          <p className="text-gray-400 text-sm">Detailed listing of receipts, outstanding balances, and mode of transactions</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No payment records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Customer Name</th>
                  <th className="py-3 px-6">Total Bill</th>
                  <th className="py-3 px-6">Paid Amount</th>
                  <th className="py-3 px-6">Pending Dues</th>
                  <th className="py-3 px-6">Payment Mode</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors text-sm text-gray-700">
                    <td className="py-3.5 px-6 text-gray-500">{item.date}</td>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">{item.customer_name}</td>
                    <td className="py-3.5 px-6 text-gray-600">₹ {parseFloat(item.total_amount).toLocaleString()}</td>
                    <td className="py-3.5 px-6 font-semibold text-green-700">₹ {parseFloat(item.paid).toLocaleString()}</td>
                    <td className={`py-3.5 px-6 font-bold ${parseFloat(item.pending) > 0 ? 'text-red-600' : 'text-green-800'}`}>
                      ₹ {parseFloat(item.pending).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        item.mode === 'UPI' ? 'bg-blue-50 text-blue-700' :
                        item.mode === 'Bank' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'
                      }`}>
                        {item.mode}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0B3B24] p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Log Payout Receipt</h3>
                <p className="text-green-300 text-xs mt-0.5">Log a customer transaction</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Customer *</label>
                  <select
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm bg-white"
                  >
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.village})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Total Bill (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Paid Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 3000"
                    value={paid}
                    onChange={(e) => setPaid(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Payment Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank">Bank</option>
                </select>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center text-sm font-semibold">
                <span className="text-gray-500">Remaining Balance:</span>
                <span className="text-red-600 text-lg">₹ {((parseFloat(totalAmount) || 0) - (parseFloat(paid) || 0)).toLocaleString()}</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B3B24] hover:bg-[#08291a] text-white font-bold rounded-xl text-sm cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
