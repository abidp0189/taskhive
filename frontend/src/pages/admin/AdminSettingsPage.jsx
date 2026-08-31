import React, { useState, useEffect } from 'react';
import { Settings, Save, CreditCard, Plus, Trash2, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    platform_fee_percent: '10',
    screenshot_fee_percent: '3',
    withdrawal_fee_percent: '6',
    min_job_budget: '0.80',
    min_withdrawal_amount: '1.00',
    min_deposit_amount: '1.00',
    default_estimated_days: '3',
    boost_1m_price: '0.04',
    boost_5m_price: '0.07',
    boost_10m_price: '0.15',
    boost_15m_price: '0.20',
    referral_task_commission_percent: '5',
    referral_deposit_commission_percent: '5',
    task_expiry_hours: '48',
    max_resubmissions: '3',
    site_name: 'Tomar Kaj',
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Payment Method Modal / Form
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethod, setNewMethod] = useState({
    name: 'bKash Personal',
    type: 'BKASH',
    number: '',
    accountName: '',
    sortOrder: 0,
    isActive: true,
  });

  const fetchAll = async () => {
    try {
      const [settingsRes, methodsRes] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/payment-methods'),
      ]);
      if (settingsRes.data?.success) {
        setSettings((prev) => ({ ...prev, ...settingsRes.data.data }));
      }
      if (methodsRes.data?.success) {
        setPaymentMethods(methodsRes.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleChange = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/admin/settings', settings);
      if (res.data?.success) {
        toast.success('Platform settings updated and recorded to audit log!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    if (!newMethod.number.trim()) {
      toast.error('Payment phone number is required');
      return;
    }
    try {
      const res = await api.post('/admin/payment-methods', newMethod);
      if (res.data?.success) {
        toast.success('Payment method added successfully');
        setShowAddMethod(false);
        setNewMethod({ name: 'bKash Personal', type: 'BKASH', number: '', accountName: '', sortOrder: 0, isActive: true });
        fetchAll();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add payment method');
    }
  };

  const handleToggleActive = async (method) => {
    try {
      const res = await api.patch(`/admin/payment-methods/${method.id}`, { isActive: !method.isActive });
      if (res.data?.success) {
        toast.success(`Payment method ${!method.isActive ? 'activated' : 'deactivated'}`);
        fetchAll();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment method');
    }
  };

  const handleDeleteMethod = async (id) => {
    if (!confirm('Are you sure you want to delete this payment number?')) return;
    try {
      const res = await api.delete(`/admin/payment-methods/${id}`);
      if (res.data?.success) {
        toast.success('Payment method removed');
        fetchAll();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete payment method');
    }
  };

  return (
    <div className="py-8 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Platform Configuration & Financial Rules
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Configure fees, deposit/withdrawal thresholds, boost prices, and manage active bKash/Nagad payment numbers.
        </p>
      </div>

      {/* ─── Platform Settings Form ─────────────────────── */}
      <form onSubmit={handleSaveSettings} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-gray-800">
          <Settings className="h-5 w-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">System Financial Rules</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
          <div>
            <label className="block font-semibold text-gray-300 mb-1.5">Platform Fee (%)</label>
            <input
              type="number"
              step="0.1"
              value={settings.platform_fee_percent}
              onChange={(e) => handleChange('platform_fee_percent', e.target.value)}
              className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-gray-500">Default: 10% on base worker budget</span>
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1.5">Screenshot/Proof Fee (%)</label>
            <input
              type="number"
              step="0.1"
              value={settings.screenshot_fee_percent}
              onChange={(e) => handleChange('screenshot_fee_percent', e.target.value)}
              className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-gray-500">Default: 3% when proof image is requested</span>
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1.5">Worker Withdrawal Fee (%)</label>
            <input
              type="number"
              step="0.1"
              value={settings.withdrawal_fee_percent}
              onChange={(e) => handleChange('withdrawal_fee_percent', e.target.value)}
              className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-gray-500">Default: 6% per withdrawal</span>
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1.5">Minimum Job Budget ($ USD)</label>
            <input
              type="number"
              step="0.01"
              value={settings.min_job_budget}
              onChange={(e) => handleChange('min_job_budget', e.target.value)}
              className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-gray-500">Default: $0.80 minimum campaign</span>
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1.5">Minimum Withdrawal ($ USD)</label>
            <input
              type="number"
              step="0.01"
              value={settings.min_withdrawal_amount}
              onChange={(e) => handleChange('min_withdrawal_amount', e.target.value)}
              className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-gray-500">Default: $1.00</span>
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1.5">Minimum Deposit ($ USD)</label>
            <input
              type="number"
              step="0.01"
              value={settings.min_deposit_amount}
              onChange={(e) => handleChange('min_deposit_amount', e.target.value)}
              className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-gray-500">Default: $1.00 minimum deposit</span>
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1.5">Default Estimated Days</label>
            <input
              type="number"
              value={settings.default_estimated_days}
              onChange={(e) => handleChange('default_estimated_days', e.target.value)}
              className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-gray-500">Default: 3 days completion</span>
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1.5">Boost 1 Min Price ($ USD)</label>
            <input
              type="number"
              step="0.01"
              value={settings.boost_1m_price}
              onChange={(e) => handleChange('boost_1m_price', e.target.value)}
              className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-gray-500">Default: $0.04</span>
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1.5">Boost 5 Min Price ($ USD)</label>
            <input
              type="number"
              step="0.01"
              value={settings.boost_5m_price}
              onChange={(e) => handleChange('boost_5m_price', e.target.value)}
              className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-gray-500">Default: $0.07</span>
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1.5">Boost 10 Min Price ($ USD)</label>
            <input
              type="number"
              step="0.01"
              value={settings.boost_10m_price}
              onChange={(e) => handleChange('boost_10m_price', e.target.value)}
              className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-gray-500">Default: $0.15</span>
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1.5">Boost 15 Min Price ($ USD)</label>
            <input
              type="number"
              step="0.01"
              value={settings.boost_15m_price}
              onChange={(e) => handleChange('boost_15m_price', e.target.value)}
              className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-gray-500">Default: $0.20</span>
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1.5">Referral Task Commission (%)</label>
            <input
              type="number"
              step="0.1"
              value={settings.referral_task_commission_percent}
              onChange={(e) => handleChange('referral_task_commission_percent', e.target.value)}
              className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1.5">Referral Deposit Commission (%)</label>
            <input
              type="number"
              step="0.1"
              value={settings.referral_deposit_commission_percent}
              onChange={(e) => handleChange('referral_deposit_commission_percent', e.target.value)}
              className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-8 py-3 text-xs font-bold text-white shadow-lg transition-all hover:scale-105"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      {/* ─── Payment Methods Management ─────────────────── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Dynamic Payment Numbers (bKash / Nagad)</h3>
              <p className="text-[11px] text-gray-400">Manage payment numbers shown dynamically to employers during deposit.</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddMethod(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Payment Number
          </button>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">No payment methods configured yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Method Name</th>
                  <th className="py-3 px-4">Gateway Type</th>
                  <th className="py-3 px-4">Account Number</th>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {paymentMethods.map((pm) => (
                  <tr key={pm.id} className="hover:bg-gray-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{pm.name}</td>
                    <td className="py-3.5 px-4 font-medium text-indigo-300">{pm.type}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{pm.number}</td>
                    <td className="py-3.5 px-4 text-gray-400">{pm.accountName || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(pm)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                          pm.isActive
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-gray-800 text-gray-500 border border-gray-700'
                        }`}
                      >
                        {pm.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteMethod(pm.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Delete Method"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Payment Method Modal */}
      {showAddMethod && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add Dynamic Payment Gateway</h3>
            <form onSubmit={handleAddPaymentMethod} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Display Name</label>
                <input
                  type="text"
                  value={newMethod.name}
                  onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                  placeholder="e.g. bKash Personal or Nagad Personal"
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Gateway Type</label>
                <select
                  value={newMethod.type}
                  onChange={(e) => setNewMethod({ ...newMethod, type: e.target.value })}
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none"
                >
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Account Phone Number</label>
                <input
                  type="text"
                  value={newMethod.number}
                  onChange={(e) => setNewMethod({ ...newMethod, number: e.target.value })}
                  placeholder="017XXXXXXXX or 018XXXXXXXX"
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white font-mono focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Account Title / Name (Optional)</label>
                <input
                  type="text"
                  value={newMethod.accountName}
                  onChange={(e) => setNewMethod({ ...newMethod, accountName: e.target.value })}
                  placeholder="e.g. Tomar Kaj Official"
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddMethod(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg transition-colors"
                >
                  Save Payment Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
