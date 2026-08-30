import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { Copy, Check, Users, Gift, Share2, DollarSign } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const ReferralPage = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referralInfo, setReferralInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [infoRes, statsRes] = await Promise.allSettled([
          api.get('/referral'),
          api.get('/referral/stats')
        ]);
        if (infoRes.status === 'fulfilled' && infoRes.value.data?.success) {
          setReferralInfo(infoRes.value.data.data);
        }
        if (statsRes.status === 'fulfilled' && statsRes.value.data?.success) {
          setStats(statsRes.value.data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const referralLink = referralInfo?.referralLink || `${window.location.origin}/register?ref=${user?.referralCode || ''}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Referral & Affiliate Program
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Earn a lifetime 5% commission on all completed task rewards from your invited members.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Invited Members"
          value={stats?.totalReferrals || 0}
          subtitle="Direct registered affiliates"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Total Referral Earnings"
          value={`$${(stats?.totalCommission || 0).toFixed(2)}`}
          subtitle="Credited directly to available balance"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Commission Rate"
          value="5%"
          subtitle="Instant credit upon approval"
          icon={Gift}
          color="purple"
        />
      </div>

      {/* Referral Link Box */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Your Personal Referral Link</h3>
        </div>
        <p className="text-xs text-gray-400">
          Share this URL with friends, online communities, or on social media. When someone registers, they are automatically tied to your account.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="flex-1 rounded-xl bg-gray-950 border border-gray-800 px-4 py-3 text-xs sm:text-sm text-indigo-300 font-mono select-all overflow-x-auto">
            {referralLink}
          </div>
          <button
            type="button"
            onClick={copyToClipboard}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-105"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied Link' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Referrals List Table */}
      <div className="glass-panel rounded-3xl p-6 overflow-hidden border border-gray-800 space-y-4">
        <h3 className="text-base font-bold text-white">Invited Members List</h3>
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading referral stats...</div>
        ) : !stats || stats.referrals?.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            You haven't referred any members yet. Share your link above to start earning passive commissions!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">Commissions Generated</th>
                  <th className="py-3 px-4">Total Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {stats.referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{r.referredUser?.name}</td>
                    <td className="py-3.5 px-4 text-gray-400">{new Date(r.joinedAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-gray-300">{r.commissionCount} tasks</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">${parseFloat(r.totalCommission).toFixed(2)}</td>
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
