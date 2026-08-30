import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { User, Lock, Mail, Phone, Globe, Shield, Save } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [countries, setCountries] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [countryId, setCountryId] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setCountryId(user.countryId || '');
    }
    api.get('/categories/countries')
      .then((res) => {
        if (res.data?.success) setCountries(res.data.data);
      })
      .catch(() => {});
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    await updateProfile({ name, phone, bio, countryId: countryId || null });
    setSavingProfile(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await api.post('/auth/change-password', { currentPassword, newPassword });
      if (res.data?.success) {
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="py-8 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Account & Security Settings
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Manage your personal details, contact preferences, and authentication password.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col items-center text-center space-y-4 h-fit">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold uppercase shadow-xl">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{user?.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Badge variant="primary">{user?.role}</Badge>
              <Badge variant="success">{user?.status}</Badge>
            </div>
          </div>

          <div className="w-full pt-4 border-t border-gray-800 text-xs text-left space-y-2 text-gray-400">
            <p className="flex justify-between">
              <span>Referral Code:</span>
              <span className="font-mono text-indigo-300 font-semibold">{user?.referralCode}</span>
            </p>
            <p className="flex justify-between">
              <span>Member Since:</span>
              <span className="text-gray-300">{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Info Form */}
          <form onSubmit={handleProfileSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-gray-800">
              <User className="h-4 w-4 text-indigo-400" /> Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Country / Region</label>
              <select
                value={countryId}
                onChange={(e) => setCountryId(e.target.value)}
                className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Bio / Skills</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief summary of your skills and background..."
                className="w-full rounded-xl bg-gray-950 border border-gray-800 p-3 text-xs sm:text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow transition-all"
            >
              <Save className="h-4 w-4" />
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handlePasswordSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-gray-800">
              <Lock className="h-4 w-4 text-purple-400" /> Security & Password
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-6 py-2.5 text-xs font-semibold text-white shadow transition-all"
            >
              <Shield className="h-4 w-4" />
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
