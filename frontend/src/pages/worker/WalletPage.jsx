import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Download 
} from 'lucide-react';
import api from '../../services/api';

export const WalletPage = () => {
  const { wallet, refreshWallet } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshWallet();
    api.get('/wallet/transactions?limit=25')
      .then((res) => {
        if (res.data?.success) setTransactions(res.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header & Withdraw CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6 sm:p-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Wallet & Financial Ledger
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Complete cryptographic audit trail of all task earnings, commissions, and withdrawals.
          </p>
        </div>

        <Link
          to="/withdraw"
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
        >
          <ArrowUpRight className="h-4 w-4" /> Request Payout
        </Link>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Available Balance"
          value={`$${parseFloat(wallet?.availableBalance || 0).toFixed(2)}`}
          subtitle="Unlocked funds available for withdrawal"
          icon={WalletIcon}
          color="emerald"
        />
        <StatCard
          title="Pending / Locked in Tasks"
          value={`$${parseFloat(wallet?.lockedBalance || 0).toFixed(2)}`}
          subtitle="Pending withdrawal verification"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Deposit Balance"
          value={`$${parseFloat(wallet?.depositBalance || 0).toFixed(2)}`}
          subtitle="Available for posting employer campaigns"
          icon={DollarSign}
          color="indigo"
        />
      </div>

      {/* Transactions Ledger */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-gray-800 space-y-4 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" /> Transaction Ledger
          </h3>
          <span className="text-xs text-gray-500 font-medium">All amounts verified</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">
            Loading financial records...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">
            No wallet transactions recorded yet. Complete jobs to start earning.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Transaction Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {transactions.map((tx) => {
                  const isCredit = tx.direction === 'CREDIT';
                  return (
                    <tr key={tx.id} className="hover:bg-gray-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded-lg ${isCredit ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                            {isCredit ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                          </span>
                          <span className="text-xs">{tx.type}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 max-w-xs truncate">
                        {tx.description || 'System transaction'}
                      </td>
                      <td className={`py-3.5 px-4 font-bold ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCredit ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 font-mono">
                        ${parseFloat(tx.balanceAfter).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
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
