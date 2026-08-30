import React, { useState, useEffect } from 'react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  CheckCircle, 
  Ban, 
  DollarSign, 
  Plus, 
  Minus 
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Balance Adjustment Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('available'); // 'available' | 'deposit'
  const [isCredit, setIsCredit] = useState(true);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = '/admin/users?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (roleFilter) url += `role=${roleFilter}&`;
      const res = await api.get(url);
      if (res.data?.success) setUsers(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleStatusChange = async (userId, newStatus) => {
    const reason = prompt(`Enter reason for updating status to ${newStatus}:`);
    if (reason === null) return; // user cancelled

    try {
      const res = await api.patch(`/admin/users/${userId}/status`, { status: newStatus, reason });
      if (res.data?.success) {
        toast.success(`User status updated to ${newStatus}`);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleBalanceAdjust = async (e) => {
    e.preventDefault();
    if (!adjustAmount || !adjustReason.trim()) {
      toast.error('Amount and reason are required');
      return;
    }

    const finalAmount = (isCredit ? 1 : -1) * parseFloat(adjustAmount);
    setAdjusting(true);
    try {
      const res = await api.post(`/admin/users/${selectedUser.id}/balance-adjustment`, {
        amount: finalAmount,
        type: adjustType,
        reason: adjustReason.trim(),
      });
      if (res.data?.success) {
        toast.success('Balance adjusted with audit log record created.');
        setSelectedUser(null);
        setAdjustAmount('');
        setAdjustReason('');
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Balance adjustment failed');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          User & Account Management
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Search accounts, inspect balances, enforce bans, and perform audited balance adjustments.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center h-full text-gray-500 w-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, referral code..."
              className="w-full rounded-xl bg-gray-950 border border-gray-800 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs sm:text-sm text-gray-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="WORKER">Workers Only</option>
            <option value="EMPLOYER">Employers Only</option>
            <option value="ADMIN">Admins Only</option>
          </select>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-3xl p-6 overflow-hidden border border-gray-800 space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">Loading user accounts...</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">No users found matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Available Balance</th>
                  <th className="py-3 px-4">Deposit Balance</th>
                  <th className="py-3 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {u.name}
                      <span className="block text-[11px] text-gray-400 font-normal">{u.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="primary">{u.role}</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge>{u.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      ${parseFloat(u.wallet?.availableBalance || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-purple-400">
                      ${parseFloat(u.wallet?.depositBalance || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800 text-indigo-400 font-semibold transition-colors"
                        title="Adjust balance"
                      >
                        Adjust $
                      </button>

                      {u.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleStatusChange(u.id, 'SUSPENDED')}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 hover:bg-rose-900 font-semibold transition-colors"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(u.id, 'ACTIVE')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 font-semibold transition-colors"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Balance Adjustment Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`Manual Balance Adjustment — ${selectedUser?.name || ''}`}
      >
        {selectedUser && (
          <form onSubmit={handleBalanceAdjust} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 space-y-1 text-[11px]">
              <p><span className="text-gray-400">Account:</span> <span className="font-semibold text-white">{selectedUser.name} ({selectedUser.email})</span></p>
              <p><span className="text-gray-400">Current Available:</span> <span className="font-bold text-emerald-400">${parseFloat(selectedUser.wallet?.availableBalance || 0).toFixed(2)}</span></p>
              <p><span className="text-gray-400">Current Deposit:</span> <span className="font-bold text-purple-400">${parseFloat(selectedUser.wallet?.depositBalance || 0).toFixed(2)}</span></p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Wallet Field</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="available">Worker Available Balance</option>
                  <option value="deposit">Employer Deposit Balance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCredit(true)}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 ${
                      isCredit ? 'bg-emerald-600 text-white' : 'bg-gray-950 text-gray-400 border border-gray-800'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" /> Credit (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCredit(false)}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 ${
                      !isCredit ? 'bg-rose-600 text-white' : 'bg-gray-950 text-gray-400 border border-gray-800'
                    }`}
                  >
                    <Minus className="h-3.5 w-3.5" /> Debit (-)
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Amount ($ USD)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="10.00"
                className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-xs text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Audit Reason (Mandatory)
              </label>
              <textarea
                rows={3}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="State precise reason for this manual ledger adjustment..."
                className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-xs text-white focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={adjusting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow disabled:opacity-50 transition-colors"
            >
              {adjusting ? 'Recording Audit...' : 'Execute Balance Adjustment'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};
