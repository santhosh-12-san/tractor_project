import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, X, Fuel as FuelIcon } from 'lucide-react';
import { api } from '../services/api';

export default function Fuel() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [driver, setDriver] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [litres, setLitres] = useState('');
  const [pricePerLitre, setPricePerLitre] = useState('90');
  const [meterReading, setMeterReading] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fuelData, driversData] = await Promise.all([
        api.fuel.list(),
        api.drivers.list()
      ]);
      setFuelLogs(fuelData);
      setDrivers(driversData);
      if (driversData.length > 0) {
        setDriver(driversData[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load fuel logs data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!driver || !litres || !pricePerLitre || !meterReading) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    try {
      await api.fuel.create({
        driver: parseInt(driver),
        date,
        litres: parseFloat(litres),
        price_per_litre: parseFloat(pricePerLitre),
        meter_reading: parseInt(meterReading)
      });
      setIsModalOpen(false);
      // Reset form
      setLitres('');
      setMeterReading('');
      loadData();
    } catch (err) {
      setError('Failed to create fuel log.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fuel log?')) {
      try {
        await api.fuel.delete(id);
        loadData();
      } catch (err) {
        console.error('Failed to delete fuel log', err);
      }
    }
  };

  const filtered = fuelLogs.filter(f => 
    f.driver_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalLitres = filtered.reduce((sum, item) => sum + parseFloat(item.litres || 0), 0);
  const totalFuelCost = filtered.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Fuel Consumed</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">{totalLitres} Litres</p>
          </div>
          <div className="p-3 rounded-xl bg-green-50 text-green-600">
            <FuelIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Fuel Cost</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">₹ {totalFuelCost.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <FuelIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search fuel by driver..."
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
          Add Fuel Log
        </button>
      </div>

      {/* Fuel Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Fuel Consumption Records</h3>
          <p className="text-gray-400 text-sm">Reviewing tractor refueling history and meter indexes</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No fuel logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Driver</th>
                  <th className="py-3 px-6">Litres</th>
                  <th className="py-3 px-6">Price / Ltr</th>
                  <th className="py-3 px-6">Total Amount</th>
                  <th className="py-3 px-6">Meter Reading</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors text-sm text-gray-700">
                    <td className="py-3.5 px-6 text-gray-500">{item.date}</td>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">{item.driver_name}</td>
                    <td className="py-3.5 px-6 font-semibold text-gray-800">{item.litres} L</td>
                    <td className="py-3.5 px-6 text-gray-500">₹ {item.price_per_litre}</td>
                    <td className="py-3.5 px-6 font-bold text-gray-800">₹ {parseFloat(item.total_amount).toLocaleString()}</td>
                    <td className="py-3.5 px-6 text-indigo-700 font-medium">{item.meter_reading} km/h</td>
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

      {/* Add Fuel Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0B3B24] p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Log Fuel Intake</h3>
                <p className="text-green-300 text-xs mt-0.5">Record diesel purchases and hour metrics</p>
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
                    onChange={(e) => setDriver(e.target.value)}
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
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Litres *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 20"
                    value={litres}
                    onChange={(e) => setLitres(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Price per Litre (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={pricePerLitre}
                    onChange={(e) => setPricePerLitre(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Meter Reading *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1250"
                  value={meterReading}
                  onChange={(e) => setMeterReading(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center text-sm font-semibold">
                <span className="text-gray-500">Total Price:</span>
                <span className="text-gray-800 text-lg">₹ {((parseFloat(litres) || 0) * (parseFloat(pricePerLitre) || 0)).toLocaleString()}</span>
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
