import React, { useState } from 'react';
import { User, Phone, Mail, Lock, CheckCircle } from 'lucide-react';

export default function Settings() {
  const [name, setName] = useState('Owner');
  const [phone, setPhone] = useState('9988776655');
  const [email, setEmail] = useState('owner@gmail.com');
  const [password, setPassword] = useState('');
  const [saved, setSaved] = useState(false);

  const handleUpdate = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="bg-[#0B3B24] p-6 text-white">
        <h3 className="text-lg font-bold">Profile Settings</h3>
        <p className="text-green-300 text-xs mt-0.5">Manage your personal information and login credentials</p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleUpdate} className="p-6 space-y-6">
        {saved && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded">
            <CheckCircle className="w-5 h-5" />
            Profile updated successfully!
          </div>
        )}

        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">
            Personal Details
          </h4>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">
            Security & Authentication
          </h4>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Change Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="Enter new password (optional)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#0B3B24] hover:bg-[#08291a] text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Update Profile
          </button>
        </div>
      </form>
    </div>
  );
}
