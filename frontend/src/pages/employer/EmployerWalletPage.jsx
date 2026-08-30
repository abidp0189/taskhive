import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { 
  DollarSign, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  ArrowDownLeft, 
  Layers,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const EmployerWalletPage = () => {
  const { wallet, refreshWallet } = useAuth();
  const [deposits, setDeposits] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [amount, setAmount] = useState('');
  const [providerReference, setProviderReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const fetchPaymentMethods = async () => {
    try {
      const res = await api.get('/wallet/payment-methods');
      if (res.data?.success && res.data.data.length > 0) {
        setPaymentMethods(res.data.data);
        setSelectedMethodId(res.data.data[0].id);
      }
    } catch (e) {
      console.error('Failed to load payment methods', e);
    }
  };

  const fetchDeposits = async () => {
    try {
      const res = await api.get('/wallet/deposits');
      if (res.data?.success) setDeposits(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshWallet();
    fetchPaymentMethods();
    fetchDeposits();
  }, []);

  const copyNumber = (num, id) => {
    if (!num) return;
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    toast.success(`Copied account number: ${num}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 1.0) {
      toast.error('Minimum deposit amount is $1.00');
      return;
    }

    if (!providerReference.trim()) {
      toast.error('Please enter your Transaction ID (TxID)');
      return;
    }

    const currentMethod = paymentMethods.find((m) => m.id === selectedMethodId);

    setSubmitting(true);
    try {
      const res = await api.post('/wallet/deposits', {
        amount: numAmount,
        paymentMethod: currentMethod ? `${currentMethod.name} (${currentMethod.number})` : 'bKash / Nagad',
        paymentMethodId: selectedMethodId || null,
        providerReference: providerReference.trim(),
        notes: notes.trim() || null,
      });

      if (res.data?.success) {
        toast.success('Deposit request submitted! Admin will verify and credit your deposit balance.');
        setAmount('');
        setProviderReference('');
        setNotes('');
        refreshWallet();
        fetchDeposits();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deposit request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId);

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Employer Deposit & Campaign Escrow
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Deposit funds via bKash or Nagad to launch microjob campaigns. Funds remain in your deposit balance until escrowed.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <StatCard
          title="Available Deposit Balance"
          value={`$${parseFloat(wallet?.depositBalance || 0).toFixed(2)}`}
          subtitle="Ready to fund new campaigns"
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Locked in Active Escrow"
          value={`$${parseFloat(wallet?.lockedBalance || 0).toFixed(2)}`}
          subtitle="Secured for pending worker submissions"
          icon={ShieldCheck}
          color="indigo"
        />
      </div>

      {/* Main Form & Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleDeposit} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-4 border-b border-gray-800">
              <CreditCard className="h-5 w-5 text-purple-400" /> Make a Manual Deposit
            </h3>

            {/* Dynamic Admin Payment Numbers */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-300">
                1. Select Active Payment Gateway & Send Money
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods.map((m) => {
                  const isSelected = selectedMethodId === m.id;
                  const isCopied = copiedId === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMethodId(m.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-purple-500 bg-purple-950/40 shadow-lg shadow-purple-500/10'
                          : 'border-gray-800 bg-gray-950/60 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{m.type === 'BKASH' ? '📱' : '📲'}</span>
                          <div>
                            <p className="text-xs font-bold text-white">{m.name}</p>
                            {m.accountName && <p className="text-[10px] text-gray-400">{m.accountName}</p>}
                          </div>
                        </div>
                        {isSelected && <span className="h-2 w-2 rounded-full bg-purple-400" />}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-gray-800/80 flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-emerald-400 select-all">
                          {m.number}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyNumber(m.number, m.id);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-[10px] font-semibold text-gray-200 transition-colors"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {paymentMethods.length === 0 && (
                <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 text-xs text-gray-400 text-center">
                  Loading payment gateways...
                </div>
              )}
            </div>

            {/* Step 2 Form Details */}
            <div className="space-y-4 pt-2">
              <label className="block text-xs font-semibold text-gray-300">
                2. Enter Transaction & Amount Details
              </label>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Deposit Amount ($ USD)
                </label>
                <div className="relative">
                  <DollarSign className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center h-full text-gray-500 w-4" />
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="10.00"
                    className="w-full rounded-xl bg-gray-950/80 border border-gray-800 pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Payment Transaction ID (TxID)
                </label>
                <input
                  type="text"
                  value={providerReference}
                  onChange={(e) => setProviderReference(e.target.value)}
                  placeholder="e.g. 9J4K2L9901"
                  className="w-full rounded-xl bg-gray-950/80 border border-gray-800 px-4 py-3 text-sm text-white font-mono placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Sender Number / Reference Info (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Your bKash / Nagad phone number for faster verification"
                  className="w-full rounded-xl bg-gray-950/80 border border-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !amount || !providerReference}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all hover:scale-[1.01]"
            >
              {submitting ? 'Submitting Request...' : 'Submit Deposit for Verification'}
            </button>
          </form>
        </div>

        {/* Instructions Card */}
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 border-purple-900/40 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-purple-400" /> How to Deposit
            </h3>
            <ol className="list-decimal list-inside space-y-2.5 text-gray-300">
              <li>
                Click the <strong className="text-white">Copy</strong> button on our active bKash or Nagad Personal number.
              </li>
              <li>
                Open your bKash or Nagad App and complete <strong className="text-white">Send Money</strong> for your desired USD equivalent amount.
              </li>
              <li>
                Copy the <strong className="text-white">TrxID / TxID</strong> from your confirmation SMS or app receipt.
              </li>
              <li>
                Submit the form with the amount and TxID.
              </li>
              <li>
                Our admin team verifies the transaction and credits your deposit wallet promptly.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Deposit History */}
      <div className="glass-panel rounded-3xl p-6 overflow-hidden border border-gray-800 space-y-4">
        <h3 className="text-base font-bold text-white">Deposit History</h3>
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading deposit records...</div>
        ) : deposits.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">No deposit records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Reference (TxID)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {deposits.map((d) => {
                  const isRejected = d.status === 'FAILED';
                  return (
                    <tr key={d.id} className="hover:bg-gray-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">{d.paymentMethod}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">${parseFloat(d.amount).toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-gray-300 font-mono">
                        {d.providerReference || 'N/A'}
                        {d.rejectionReason && (
                          <span className="block text-[10px] text-rose-400 mt-0.5">
                            Reason: {d.rejectionReason}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={d.status === 'CONFIRMED' ? 'success' : isRejected ? 'danger' : 'warning'}>
                          {isRejected ? 'REJECTED' : d.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-[11px]">{new Date(d.createdAt).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
