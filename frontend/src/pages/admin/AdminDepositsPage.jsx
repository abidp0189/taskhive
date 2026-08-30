import React, { useState, useEffect } from 'react';
import { Badge } from '../../components/common/Badge';
import { DollarSign, CheckCircle2, XCircle, AlertCircle, Copy, Check } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const AdminDepositsPage = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/admin/deposits?status=${statusFilter}` : '/admin/deposits';
      const res = await api.get(url);
      if (res.data?.success) setDeposits(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [statusFilter]);

  const handleConfirm = async (depositId) => {
    const notes = prompt('Enter optional admin note for this confirmation:');
    try {
      const res = await api.post(`/admin/deposits/${depositId}/confirm`, { notes });
      if (res.data?.success) {
        toast.success('Deposit confirmed! Employer wallet credited.');
        fetchDeposits();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm deposit');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectingId) return;

    try {
      const res = await api.post(`/admin/deposits/${rejectingId}/reject`, {
        reason: rejectReason.trim() || 'Transaction could not be verified with payment provider',
      });
      if (res.data?.success) {
        toast.success('Deposit rejected. User has been notified.');
        setRejectingId(null);
        setRejectReason('');
        fetchDeposits();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject deposit');
    }
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('TxID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Employer Deposit Queue
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Verify incoming funds from employer payment gateways (bKash/Nagad) and confirm or reject requests.
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'PENDING', label: 'Pending Approval' },
          { key: 'CONFIRMED', label: 'Confirmed (Credited)' },
          { key: 'FAILED', label: 'Rejected' },
          { key: '', label: 'All History' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              statusFilter === s.key
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-3xl p-6 overflow-hidden border border-gray-800 space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">Loading deposit requests...</div>
        ) : deposits.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">No deposit requests found in this queue.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Employer</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Provider Ref (TxID)</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {deposits.map((d) => {
                  const isRejected = d.status === 'FAILED';
                  return (
                    <tr key={d.id} className="hover:bg-gray-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {d.user?.name}
                        <span className="block text-[11px] text-gray-400 font-normal">{d.user?.email}</span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 font-medium">{d.paymentMethod}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">${parseFloat(d.amount).toFixed(2)}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-indigo-300">
                        {d.providerReference ? (
                          <div className="flex items-center gap-1.5">
                            <span className="select-all">{d.providerReference}</span>
                            <button
                              onClick={() => copyToClipboard(d.providerReference, d.id)}
                              className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-colors"
                              title="Copy TxID"
                            >
                              {copiedId === d.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500">None</span>
                        )}
                        {d.notes && <span className="block text-[10px] text-gray-400 mt-0.5">Note: {d.notes}</span>}
                        {d.rejectionReason && (
                          <span className="block text-[10px] text-rose-400 mt-0.5">Reason: {d.rejectionReason}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={d.status === 'CONFIRMED' ? 'success' : isRejected ? 'danger' : 'warning'}>
                          {isRejected ? 'REJECTED' : d.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {d.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleConfirm(d.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
                            </button>
                            <button
                              onClick={() => {
                                setRejectingId(d.id);
                                setRejectReason('');
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white font-semibold transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Reject Deposit Request</h3>
            </div>
            <p className="text-xs text-gray-300">
              Please state the reason for rejecting this deposit. The employer will be notified with this reason.
            </p>
            <form onSubmit={handleReject} className="space-y-4">
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Transaction ID not found in bKash statement or amount does not match..."
                className="w-full rounded-xl bg-gray-950 border border-gray-800 p-3 text-xs text-white placeholder-gray-500 focus:border-rose-500 focus:outline-none"
                required
              />
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingId(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/20 transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
