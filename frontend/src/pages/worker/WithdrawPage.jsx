import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { ArrowUpRight, DollarSign, ShieldCheck, AlertCircle, CheckCircle2, Wallet, CreditCard } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PaymentMethodBadge } from '../../components/common/PaymentLogos';

const DEFAULT_METHODS = [
  { id: 'bKash Personal', name: 'bKash Personal', type: 'BKASH', icon: '📱' },
  { id: 'Nagad Personal', name: 'Nagad Personal', type: 'NAGAD', icon: '📲' },
];

export const WithdrawPage = () => {
  const { user, wallet, refreshWallet } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState(DEFAULT_METHODS[0].id);
  const [amount, setAmount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [withdrawals, setWithdrawals] = useState([]);
  const [config, setConfig] = useState({
    withdrawal_fee_percent: 6,
    min_withdrawal_amount: 1.00,
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchConfigAndHistory = async () => {
    try {
      const [configRes, historyRes] = await Promise.all([
        api.get('/wallet/config'),
        api.get('/wallet/withdrawals'),
      ]);
      if (configRes.data?.success) {
        setConfig(configRes.data.data);
      }
      if (historyRes.data?.success) {
        setWithdrawals(historyRes.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshWallet();
    fetchConfigAndHistory();
  }, []);

  const numAmount = parseFloat(amount) || 0;
  const feePercent = parseFloat(config.withdrawal_fee_percent || 6) / 100;
  const fee = numAmount * feePercent;
  const net = Math.max(0, numAmount - fee);
  const available = parseFloat(wallet?.availableBalance || 0);
  const minWithdrawal = parseFloat(config.min_withdrawal_amount || 1.00);

  const handleWithdraw = async (e) => {
    e.preventDefault();

    if (user?.role === 'EMPLOYER') {
      toast.error('Employer accounts cannot withdraw. Wallet funds are used for job campaigns.');
      return;
    }

    if (numAmount < minWithdrawal) {
      toast.error(`Minimum withdrawal amount is $${minWithdrawal.toFixed(2)}`);
      return;
    }

    if (numAmount > available) {
      toast.error(`Insufficient balance. You have $${available.toFixed(2)} available.`);
      return;
    }

    if (!accountNumber.trim()) {
      toast.error('Please enter your receiving bKash/Nagad phone number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/wallet/withdrawals', {
        amount: numAmount,
        method: selectedMethod,
        accountName: accountName.trim() || null,
        accountDetails: {
          accountNumber: accountNumber.trim(),
          method: selectedMethod,
        },
      });

      if (res.data?.success) {
        toast.success('Withdrawal request submitted! Admin will process your payout.');
        setAmount('');
        setAccountNumber('');
        refreshWallet();
        fetchConfigAndHistory();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Withdraw Worker Earnings
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Withdraw your approved microjob earnings directly to your bKash or Nagad Personal wallet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleWithdraw} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-400" /> Select Withdrawal Channel
              </h3>
              <span className="text-xs text-emerald-400 font-semibold">
                Available Earnings: ${available.toFixed(2)}
              </span>
            </div>

            {/* Methods Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEFAULT_METHODS.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                    selectedMethod === m.id
                      ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-lg shadow-indigo-500/10'
                      : 'border-gray-800 bg-gray-950/60 text-gray-400 hover:border-gray-700 hover:text-white'
                  }`}
                >
                  <PaymentMethodBadge method={m} className="h-8 w-8" />
                  <div>
                    <p className="text-xs font-bold text-white">{m.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Min: ${minWithdrawal.toFixed(2)} • Fee: {config.withdrawal_fee_percent}%
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Withdrawal Amount ($ USD)
                </label>
                <div className="relative">
                  <DollarSign className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center h-full text-gray-500 w-4" />
                  <input
                    type="number"
                    step="0.01"
                    min={minWithdrawal}
                    max={available}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="5.00"
                    className="w-full rounded-xl bg-gray-950/80 border border-gray-800 pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-gray-500">Minimum: ${minWithdrawal.toFixed(2)} USD</span>
                  {numAmount > 0 && (
                    <span className="text-[11px] font-semibold text-amber-400">
                      ≈ ৳{(numAmount * 100).toFixed(0)} BDT
                      <span className="text-[9px] text-gray-500 font-normal ml-1">(1$ = ৳100)</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Account Holder Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full rounded-xl bg-gray-950/80 border border-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    bKash / Nagad Phone Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="017XXXXXXXX or 018XXXXXXXX"
                    className="w-full rounded-xl bg-gray-950/80 border border-gray-800 px-4 py-3 text-sm text-white font-mono placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Calculations Box */}
            <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Requested Amount</span>
                <div className="text-right">
                  <span className="font-semibold text-white">${numAmount.toFixed(2)}</span>
                  {numAmount > 0 && <span className="text-[10px] text-amber-400 ml-1.5">≈ ৳{(numAmount * 100).toFixed(0)}</span>}
                </div>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Platform Withdrawal Fee ({config.withdrawal_fee_percent}%)</span>
                <span className="font-semibold text-rose-400">-${fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-gray-800/80">
                <span>Net Payout You Receive</span>
                <div className="text-right">
                  <span className="text-emerald-400 text-sm font-black">${net.toFixed(2)}</span>
                  {net > 0 && <span className="block text-[10px] text-amber-400 font-normal">≈ ৳{(net * 100).toFixed(0)} BDT</span>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || numAmount < minWithdrawal || numAmount > available}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all hover:scale-[1.01]"
            >
              {submitting ? 'Submitting Request...' : 'Confirm Withdrawal Request'}
            </button>
          </form>
        </div>

        {/* Right 1 Col: Guidelines */}
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 border-indigo-900/40 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Payout Policy & Safeguards
            </h3>
            <ul className="space-y-2.5 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Withdrawal fee is strictly {config.withdrawal_fee_percent}% to cover payment gateway charges.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Minimum withdrawal threshold is ${minWithdrawal.toFixed(2)} USD.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>If a payout is rejected, the full amount returns to your available balance immediately with no deduction.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="glass-panel rounded-3xl p-6 overflow-hidden border border-gray-800 space-y-4">
        <h3 className="text-base font-bold text-white">Withdrawal History</h3>
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading payout records...</div>
        ) : withdrawals.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">No withdrawal requests yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Gross Amount</th>
                  <th className="py-3 px-4">Fee ({config.withdrawal_fee_percent}%)</th>
                  <th className="py-3 px-4">Net Payout</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <PaymentMethodBadge method={w.method} className="h-5 w-5" />
                        <span>{w.method}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-300">${parseFloat(w.amount).toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-rose-400">-${parseFloat(w.fee).toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">${parseFloat(w.netAmount).toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={w.status === 'PAID' ? 'success' : w.status === 'REJECTED' ? 'danger' : 'warning'}>
                        {w.status}
                      </Badge>
                      {w.rejectionReason && (
                        <span className="block text-[10px] text-rose-400 mt-0.5">Reason: {w.rejectionReason}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">{new Date(w.requestedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
