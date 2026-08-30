import React, { useState, useEffect } from 'react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ArrowUpRight, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const AdminWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const [selectedW, setSelectedW] = useState(null);
  const [actionType, setActionType] = useState('approve'); // 'approve' | 'reject'
  const [externalReference, setExternalReference] = useState('');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/admin/withdrawals?status=${statusFilter}` : '/admin/withdrawals';
      const res = await api.get(url);
      if (res.data?.success) setWithdrawals(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter]);

  const handleProcess = async (e) => {
    e.preventDefault();
    if (actionType === 'reject' && !reason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post(`/admin/withdrawals/${selectedW.id}/process`, {
        action: actionType,
        externalReference: externalReference.trim() || null,
        reason: reason.trim() || null,
      });

      if (res.data?.success) {
        toast.success(`Withdrawal ${actionType === 'approve' ? 'marked as PAID' : 'rejected and refunded'}`);
        setSelectedW(null);
        setExternalReference('');
        setReason('');
        fetchWithdrawals();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Withdrawal Payout Queue
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Review worker payout requests, send funds via payment channels, and record TxID confirmation.
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['PENDING', 'PAID', 'REJECTED', ''].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              statusFilter === s
                ? 'bg-rose-600 text-white'
                : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {s ? s : 'All History'}
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-3xl p-6 overflow-hidden border border-gray-800 space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">Loading payout queue...</div>
        ) : withdrawals.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">No withdrawals in this queue.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Method / Account</th>
                  <th className="py-3 px-4">Requested</th>
                  <th className="py-3 px-4">Net Payout</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Process Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {w.user?.name}
                      <span className="block text-[11px] text-gray-400 font-normal">{w.user?.email}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-300">
                      <span className="font-semibold text-white">{w.method}</span>
                      <span className="block text-[11px] text-gray-400 font-mono select-all">
                        {w.accountDetails || w.accountName || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-300">${parseFloat(w.amount).toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">${parseFloat(w.netAmount).toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <Badge>{w.status}</Badge>
                      {w.externalReference && (
                        <span className="block text-[10px] text-gray-400 font-mono mt-0.5">Tx: {w.externalReference}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {w.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => { setSelectedW(w); setActionType('approve'); }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition-colors"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => { setSelectedW(w); setActionType('reject'); }}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Process Modal */}
      <Modal
        isOpen={!!selectedW}
        onClose={() => setSelectedW(null)}
        title={actionType === 'approve' ? 'Confirm Payout Paid' : 'Reject Withdrawal Request'}
      >
        {selectedW && (
          <form onSubmit={handleProcess} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 space-y-1">
              <p><span className="text-gray-400">User:</span> <span className="font-semibold text-white">{selectedW.user?.name} ({selectedW.user?.email})</span></p>
              <p><span className="text-gray-400">Method:</span> <span className="font-semibold text-white">{selectedW.method}</span></p>
              <p><span className="text-gray-400">Account:</span> <span className="font-mono text-indigo-300 font-semibold">{selectedW.accountDetails}</span></p>
              <p><span className="text-gray-400">Net Amount to Send:</span> <span className="font-black text-emerald-400 text-sm">${parseFloat(selectedW.netAmount).toFixed(2)}</span></p>
            </div>

            {actionType === 'approve' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Payment External Reference / TxID (Optional)
                </label>
                <input
                  type="text"
                  value={externalReference}
                  onChange={(e) => setExternalReference(e.target.value)}
                  placeholder="e.g. bKash TrxID / Blockchain hash"
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-xs text-white focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Rejection Reason (Refunds balance back to worker)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State reason for rejecting withdrawal (e.g. invalid account details)..."
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-xs text-white focus:outline-none"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${
                actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {processing ? 'Processing...' : actionType === 'approve' ? 'Confirm Payment Complete' : 'Reject & Refund Balance'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};
