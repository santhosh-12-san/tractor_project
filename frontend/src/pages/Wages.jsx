import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, DollarSign, Calendar, Landmark, CreditCard } from 'lucide-react';
import { api } from '../services/api';

export default function Wages() {
  const [wages, setWages] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState('');
  const [driverFilter, setDriverFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [driver, setDriver] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysWorked, setDaysWorked] = useState('1');
  const [dailyWage, setDailyWage] = useState('680');
  const [allowance, setAllowance] = useState('0');
  const [advanceGiven, setAdvanceGiven] = useState('0');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wagesData, driversData] = await Promise.all([
        api.wages.list(),
        api.drivers.list()
      ]);
      setWages(wagesData);
      setDrivers(driversData);
      if (driversData.length > 0) {
        setDriver(driversData[0].id.toString());
        setDailyWage(driversData[0].daily_wage.toString());
      }
    } catch (err) {
      console.error('Failed to load wages data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDriverChange = (driverId) => {
    setDriver(driverId);
    const selected = drivers.find(d => d.id === parseInt(driverId));
    if (selected) {
      setDailyWage(selected.daily_wage.toString());
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!driver || !daysWorked || !dailyWage) {
      setError('Please fill in Driver, Days, and Daily Wage');
      return;
    }
    setError('');
    try {
      await api.wages.create({
        driver: parseInt(driver),
        date,
        days_worked: parseInt(daysWorked),
        daily_wage: parseFloat(dailyWage),
        allowance: parseFloat(allowance || 0),
        advance_given: parseFloat(advanceGiven || 0),
        notes
      });
      setIsModalOpen(false);
      // Reset form
      setDaysWorked('1');
      setAllowance('0');
      setAdvanceGiven('0');
      setNotes('');
      loadData();
    } catch (err) {
      setError('Failed to log wage entry.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this wage log?')) {
      try {
        await api.wages.delete(id);
        loadData();
      } catch (err) {
        console.error('Failed to delete wage log', err);
      }
    }
  };

  const filtered = wages.filter(w => {
    const matchesSearch = w.driver_name.toLowerCase().includes(search.toLowerCase());
    const matchesDriver = driverFilter === 'All' || w.driver.toString() === driverFilter;
    return matchesSearch && matchesDriver;
  });

  // Calculate totals for summary cards
  const totalDays = filtered.reduce((sum, item) => sum + parseInt(item.days_worked || 0), 0);
  const totalWage = filtered.reduce((sum, item) => sum + parseFloat(item.total_wage || 0), 0);
  const totalAdvances = filtered.reduce((sum, item) => sum + parseFloat(item.advance_given || 0), 0);
  const totalRemaining = filtered.reduce((sum, item) => sum + parseFloat(item.remaining || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Days Worked</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">{totalDays} Days</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Wage Earned</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">₹ {totalWage.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-green-50 text-green-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Advances Paid</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">₹ {totalAdvances.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Remaining Dues</p>
            <p className={`text-2xl font-bold mt-2 ${totalRemaining < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              ₹ {totalRemaining.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search driver wages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm transition-all"
            />
          </div>

          <div className="relative w-full sm:w-48">
            <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm appearance-none cursor-pointer"
            >
              <option value="All">All Drivers</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-4 py-2.5 bg-[#0B3B24] hover:bg-[#08291a] text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors text-sm"
        >
          <Plus className="w-5 h-5" />
          Log Driver Wage
        </button>
      </div>

      {/* Wages Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Wage Entries</h3>
          <p className="text-gray-400 text-sm">Detailed logs of payouts, advances, and pending balances</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No wage records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Driver Name</th>
                  <th className="py-3 px-6">Days Worked</th>
                  <th className="py-3 px-6">Daily Wage</th>
                  <th className="py-3 px-6">Allowance</th>
                  <th className="py-3 px-6">Total Wage</th>
                  <th className="py-3 px-6">Advance Paid</th>
                  <th className="py-3 px-6">Remaining Due</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors text-sm text-gray-700">
                    <td className="py-3.5 px-6 text-gray-500">{item.date}</td>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">{item.driver_name}</td>
                    <td className="py-3.5 px-6">{item.days_worked} Day(s)</td>
                    <td className="py-3.5 px-6">₹ {item.daily_wage}</td>
                    <td className="py-3.5 px-6 text-green-700">+ ₹ {item.allowance}</td>
                    <td className="py-3.5 px-6 font-bold text-gray-800">₹ {parseFloat(item.total_wage).toLocaleString()}</td>
                    <td className="py-3.5 px-6 text-amber-700">- ₹ {item.advance_given}</td>
                    <td className={`py-3.5 px-6 font-bold ${parseFloat(item.remaining) < 0 ? 'text-red-600' : 'text-green-700'}`}>
                      ₹ {parseFloat(item.remaining).toLocaleString()}
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

      {/* Log Wage Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0B3B24] p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Log Driver Wage</h3>
                <p className="text-green-300 text-xs mt-0.5">Record shift earnings, allowances, and advances</p>
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
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Driver *</label>
                  <select
                    value={driver}
                    onChange={(e) => handleDriverChange(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm bg-white"
                  >
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Days Worked *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={daysWorked}
                    onChange={(e) => setDaysWorked(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Daily Wage (₹) *</label>
                  <input
                    type="number"
                    required
                    value={dailyWage}
                    onChange={(e) => setDailyWage(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Allowance (₹)</label>
                  <input
                    type="number"
                    value={allowance}
                    onChange={(e) => setAllowance(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Advance Given (₹)</label>
                  <input
                    type="number"
                    value={advanceGiven}
                    onChange={(e) => setAdvanceGiven(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Notes</label>
                <textarea
                  placeholder="Additional logs/notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                />
              </div>

              {/* Estimate Preview */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal Wage:</span>
                  <span className="font-semibold text-gray-800">₹ {(parseInt(daysWorked || 0) * parseFloat(dailyWage || 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Allowance:</span>
                  <span className="font-semibold text-green-700">+ ₹ {parseFloat(allowance || 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1 mt-1">
                  <span className="text-gray-600">Total Due:</span>
                  <span className="text-gray-800">₹ {((parseInt(daysWorked || 0) * parseFloat(dailyWage || 0)) + parseFloat(allowance || 0) - parseFloat(advanceGiven || 0)).toLocaleString()}</span>
                </div>
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
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
