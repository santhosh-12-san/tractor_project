import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Trash2, X, Check } from 'lucide-react';
import { api } from '../services/api';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const role = api.getCurrentRole();
  const customerProfileId = api.getCurrentCustomerProfile();

  // Form states
  const [customer, setCustomer] = useState('');
  const [driver, setDriver] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [workType, setWorkType] = useState('Ploughing');
  const [acresHours, setAcresHours] = useState('');
  const [rate, setRate] = useState('1000');
  const [advance, setAdvance] = useState('0');
  const [status, setStatus] = useState('Pending');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Approval flow states
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveBookingId, setApproveBookingId] = useState(null);
  const [approveDriver, setApproveDriver] = useState('');
  const [approveRate, setApproveRate] = useState('1000');
  const [approveError, setApproveError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (role === 'Customer') {
        const bookingsData = await api.bookings.list();
        setBookings(bookingsData);
        setCustomer(customerProfileId ? customerProfileId.toString() : '');
      } else {
        const [bookingsData, customersData, driversData] = await Promise.all([
          api.bookings.list(),
          api.customers.list(),
          api.drivers.list()
        ]);
        setBookings(bookingsData);
        setCustomers(customersData);
        setDrivers(driversData);

        if (customersData.length > 0) {
          setCustomer(customersData[0].id.toString());
        }
        if (driversData.length > 0) {
          setDriver(driversData[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Failed to load bookings data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    const selectedCust = role === 'Customer' ? customerProfileId : parseInt(customer);
    if (!selectedCust || !acresHours || !rate || !date) {
      setError('Please fill in Date, Acres/Hours, and Rate');
      return;
    }

    try {
      await api.bookings.create({
        customer: selectedCust,
        driver: role === 'Customer' || !driver ? null : parseInt(driver),
        date,
        work_type: workType,
        acres_hours: parseFloat(acresHours),
        rate: parseFloat(rate),
        advance: role === 'Customer' ? 0.00 : parseFloat(advance || 0),
        status: role === 'Customer' ? 'Pending' : status,
        notes
      });
      setIsModalOpen(false);
      // Reset form
      setAcresHours('');
      setNotes('');
      setAdvance('0');
      loadData();
    } catch (err) {
      if (err.response && err.response.status === 400 && err.response.data) {
        // Validation errors (e.g. double booking)
        const apiErrs = err.response.data;
        if (typeof apiErrs === 'object') {
          setValidationErrors(apiErrs);
          if (apiErrs.driver) {
            setError(apiErrs.driver[0]);
          } else if (apiErrs.non_field_errors) {
            setError(apiErrs.non_field_errors[0]);
          } else {
            setError('Validation failed. Please verify inputs.');
          }
        }
      } else {
        setError('Failed to create booking. Please check connection or inputs.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await api.bookings.delete(id);
        loadData();
      } catch (err) {
        console.error('Failed to delete booking', err);
      }
    }
  };

  const handleOpenApproveModal = (booking) => {
    setApproveBookingId(booking.id);
    setApproveDriver(booking.driver ? booking.driver.toString() : (drivers[0]?.id.toString() || ''));
    setApproveRate(booking.rate || '1000');
    setApproveError('');
    setIsApproveModalOpen(true);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    setApproveError('');

    if (!approveDriver) {
      setApproveError('Please select a Driver to approve the booking');
      return;
    }

    try {
      await api.bookings.patch(approveBookingId, {
        status: 'In Progress',
        driver: parseInt(approveDriver),
        rate: parseFloat(approveRate)
      });
      setIsApproveModalOpen(false);
      loadData();
    } catch (err) {
      if (err.response && err.response.status === 400 && err.response.data) {
        const apiErrs = err.response.data;
        if (apiErrs.driver) {
          setApproveError(apiErrs.driver[0]);
        } else if (apiErrs.non_field_errors) {
          setApproveError(apiErrs.non_field_errors[0]);
        } else {
          setApproveError('Validation failed.');
        }
      } else {
        setApproveError('Failed to approve request. Please check inputs or connections.');
      }
    }
  };

  const handleReject = async (id) => {
    if (window.confirm('Are you sure you want to reject this booking request?')) {
      try {
        await api.bookings.patch(id, { status: 'Canceled' });
        loadData();
      } catch (err) {
        console.error('Failed to reject booking request', err);
      }
    }
  };

  const handleComplete = async (id) => {
    if (window.confirm('Mark this booking as completed?')) {
      try {
        await api.bookings.patch(id, { status: 'Completed' });
        loadData();
      } catch (err) {
        console.error('Failed to complete booking', err);
      }
    }
  };

  const filtered = bookings.filter(b => {
    const matchesSearch = (b.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.work_type || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.driver_name && b.driver_name.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm transition-all"
            />
          </div>

          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm appearance-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Canceled">Canceled</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-4 py-2.5 bg-[#0B3B24] hover:bg-[#08291a] text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors text-sm"
        >
          <Plus className="w-5 h-5" />
          New Booking
        </button>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">
            {role === 'Owner' ? 'All Bookings' : 'My Bookings'}
          </h3>
          <p className="text-gray-400 text-sm">
            {role === 'Owner' ? 'Reviewing current work progress and finances' : 'Track and request your tractor bookings'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No bookings found. Click "New Booking" to add one!
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
                  <th className="py-3 px-6">Advance</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-55 hover:bg-gray-50/30 transition-colors text-sm text-gray-700">
                    <td className="py-3.5 px-6 text-gray-500 font-medium">{booking.date}</td>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">{booking.customer_name}</td>
                    <td className="py-3.5 px-6">{booking.work_type}</td>
                    <td className="py-3.5 px-6 text-gray-600">{booking.driver_name || '-'}</td>
                    <td className="py-3.5 px-6">{booking.acres_hours}</td>
                    <td className="py-3.5 px-6 text-gray-500">₹ {booking.rate}</td>
                    <td className="py-3.5 px-6 font-bold text-gray-800">₹ {parseFloat(booking.total_amount).toLocaleString()}</td>
                    <td className="py-3.5 px-6 text-green-700 font-semibold">₹ {booking.advance}</td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        booking.status === 'Completed' ? 'bg-green-50 text-green-700' :
                        booking.status === 'In Progress' ? 'bg-amber-50 text-amber-700' :
                        booking.status === 'Canceled' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {role === 'Owner' && (
                        <div className="flex justify-end items-center gap-2">
                          {booking.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleOpenApproveModal(booking)}
                                className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                                title="Approve"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleReject(booking.id)}
                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                                title="Reject"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                            </>
                          )}
                          {booking.status === 'In Progress' && (
                            <button
                              onClick={() => handleComplete(booking.id)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                              title="Mark Completed"
                            >
                              <Check className="w-3.5 h-3.5" /> Complete
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {role === 'Customer' && booking.status === 'Pending' && (
                        <span className="text-xs text-gray-400 italic">Pending Approval</span>
                      )}
                      {role === 'Customer' && booking.status !== 'Pending' && (
                        <span className="text-xs text-gray-400 italic">Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0B3B24] p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">
                  {role === 'Owner' ? 'Add Booking' : 'Request Tractor Booking'}
                </h3>
                <p className="text-green-300 text-xs mt-0.5">
                  {role === 'Owner' ? 'Log a new tractor job' : 'Submit a booking request'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded flex items-center gap-2">
                  <span>⚠️ {error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {role === 'Owner' ? (
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
                ) : (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Customer Name</label>
                    <div className="w-full px-3.5 py-2 border border-gray-250 bg-gray-50 rounded-xl text-sm font-semibold text-gray-800">
                      {customers.find(c => c.id === customerProfileId)?.name || 'My Profile'}
                    </div>
                  </div>
                )}
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
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Work Type *</label>
                  <select
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm bg-white"
                  >
                    <option value="Ploughing">Ploughing</option>
                    <option value="Rotavator">Rotavator</option>
                    <option value="Transport">Transport</option>
                    <option value="Seed Sowing">Seed Sowing</option>
                    <option value="Harvesting">Harvesting</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                {role === 'Owner' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Driver</label>
                    <select
                      value={driver}
                      onChange={(e) => setDriver(e.target.value)}
                      className={`w-full px-3.5 py-2 border rounded-xl focus:outline-none text-sm bg-white ${
                        validationErrors.driver ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                      }`}
                    >
                      <option value="">No Driver</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Acres / Hours *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 5"
                    value={acresHours}
                    onChange={(e) => setAcresHours(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                  />
                </div>
                {role === 'Owner' ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Advance Paid (₹)</label>
                    <input
                      type="number"
                      value={advance}
                      onChange={(e) => setAdvance(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col justify-end">
                    <span className="text-xs text-gray-400 italic mb-2">Owner will verify rates</span>
                  </div>
                )}
              </div>

              {role === 'Owner' && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>
              )}

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center text-sm font-semibold">
                <span className="text-gray-500">Est. Total:</span>
                <span className="text-gray-800 text-lg">₹ {((parseFloat(acresHours) || 0) * (parseFloat(rate) || 0)).toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Notes</label>
                <textarea
                  placeholder="Additional specifications"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                />
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
                  {role === 'Owner' ? 'Save Booking' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Request Modal */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0B3B24] p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Approve Booking Request</h3>
                <p className="text-green-300 text-xs mt-0.5">Assign a driver and confirm rates to approve</p>
              </div>
              <button onClick={() => setIsApproveModalOpen(false)} className="text-white/80 hover:text-white transition-colors cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="p-6 space-y-4">
              {approveError && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded flex items-center gap-2">
                  <span>⚠️ {approveError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Driver *</label>
                <select
                  required
                  value={approveDriver}
                  onChange={(e) => setApproveDriver(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm bg-white"
                >
                  <option value="">Select a Driver</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Rate (₹) *</label>
                <input
                  type="number"
                  required
                  value={approveRate}
                  onChange={(e) => setApproveRate(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B3B24] hover:bg-[#08291a] text-white font-bold rounded-xl text-sm cursor-pointer"
                >
                  Confirm & Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
