import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { 
  Users, 
  Briefcase, 
  Clock, 
  ArrowUpRight, 
  DollarSign, 
  ShieldAlert, 
  Layers, 
  Settings, 
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Camera,
  Percent
} from 'lucide-react';
import api from '../../services/api';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => {
        if (res.data?.success) setStats(res.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6 sm:p-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Master Admin Operations
            </h1>
            <Badge variant="danger">Administrator</Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Real-time marketplace monitoring, financial revenue breakdown, moderation queues, and settings.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/admin/categories"
            className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white shadow transition-all hover:scale-105"
          >
            <Layers className="h-4 w-4" /> Manage Categories
          </Link>
          <Link
            to="/admin/withdrawals"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-2.5 text-xs font-bold text-white shadow transition-all hover:scale-105"
          >
            <ArrowUpRight className="h-4 w-4" /> Payout Queue
          </Link>
          <Link
            to="/admin/settings"
            className="flex items-center gap-2 rounded-xl bg-gray-900 border border-gray-800 px-4 py-2.5 text-xs font-semibold text-gray-200 hover:bg-gray-800 hover:text-white transition-all"
          >
            <Settings className="h-4 w-4" /> Platform Settings
          </Link>
        </div>
      </div>

      {/* ─── Platform Revenue Metrics ───────────────────── */}
      <div>
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" /> Platform Revenue Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-emerald-950/20">
            <span className="text-[11px] font-semibold text-emerald-400 block mb-1">Total Platform Revenue</span>
            <span className="text-2xl font-black text-white">${(stats?.totalPlatformRevenue || 0).toFixed(2)}</span>
            <span className="text-[10px] text-gray-400 block mt-1">All combined fees & boosts</span>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[11px] font-semibold">10% Platform Fee</span>
              <Percent className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <span className="text-xl font-bold text-white">${(stats?.platformFeeRevenue || 0).toFixed(2)}</span>
            <span className="text-[10px] text-gray-500 block mt-1">From campaign creation</span>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[11px] font-semibold">3% Screenshot Fee</span>
              <Camera className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <span className="text-xl font-bold text-white">${(stats?.screenshotFeeRevenue || 0).toFixed(2)}</span>
            <span className="text-[10px] text-gray-500 block mt-1">Proof processing fees</span>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[11px] font-semibold">Boost Revenue</span>
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <span className="text-xl font-bold text-white">${(stats?.boostRevenue || 0).toFixed(2)}</span>
            <span className="text-[10px] text-gray-500 block mt-1">Marketplace priority fees</span>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[11px] font-semibold">6% Withdrawal Fee</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-rose-400" />
            </div>
            <span className="text-xl font-bold text-white">${(stats?.withdrawalFeeRevenue || 0).toFixed(2)}</span>
            <span className="text-[10px] text-gray-500 block mt-1">From paid payouts</span>
          </div>
        </div>
      </div>

      {/* ─── Operations & Queue Metrics ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Registered Users"
          value={stats?.totalUsers || 0}
          subtitle={`${stats?.activeUsers || 0} active accounts`}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Active Microjobs"
          value={stats?.activeJobs || 0}
          subtitle={`${stats?.totalJobs || 0} total campaigns`}
          icon={Briefcase}
          color="purple"
        />
        <StatCard
          title="Pending Deposits"
          value={stats?.pendingDeposits || 0}
          subtitle="Employer deposits to confirm"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Pending Withdrawals"
          value={stats?.pendingWithdrawals || 0}
          subtitle="Worker payouts to process"
          icon={ArrowUpRight}
          color="rose"
        />
      </div>

      {/* Metrics Row 3: Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Confirmed Deposits"
          value={`$${(stats?.totalDeposits || 0).toFixed(2)}`}
          subtitle="Cumulative employer capital"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Total Worker Earnings Distributed"
          value={`$${(stats?.totalPayouts || 0).toFixed(2)}`}
          subtitle="Approved task rewards"
          icon={ShieldCheck}
          color="indigo"
        />
        <StatCard
          title="Fraud & Anomaly Alerts"
          value={stats?.fraudAlerts || 0}
          subtitle="Open flagged events"
          icon={ShieldAlert}
          color="rose"
        />
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/categories"
          className="glass-card rounded-2xl p-5 hover:border-purple-500/50 transition-all flex items-center gap-4 group"
        >
          <div className="h-10 w-10 rounded-xl bg-purple-950/80 border border-purple-800 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">Categories & Subcategories</h4>
            <p className="text-xs text-gray-400 mt-0.5">Manage default rewards & tasks</p>
          </div>
        </Link>

        <Link
          to="/admin/users"
          className="glass-card rounded-2xl p-5 hover:border-indigo-500/50 transition-all flex items-center gap-4 group"
        >
          <div className="h-10 w-10 rounded-xl bg-indigo-950/80 border border-indigo-800 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">User Management</h4>
            <p className="text-xs text-gray-400 mt-0.5">Ban, verify, balance adjust</p>
          </div>
        </Link>

        <Link
          to="/admin/deposits"
          className="glass-card rounded-2xl p-5 hover:border-emerald-500/50 transition-all flex items-center gap-4 group"
        >
          <div className="h-10 w-10 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Deposit Requests</h4>
            <p className="text-xs text-gray-400 mt-0.5">Approve & reject deposits</p>
          </div>
        </Link>

        <Link
          to="/admin/withdrawals"
          className="glass-card rounded-2xl p-5 hover:border-rose-500/50 transition-all flex items-center gap-4 group"
        >
          <div className="h-10 w-10 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">Withdrawals Queue</h4>
            <p className="text-xs text-gray-400 mt-0.5">Approve, reject, mark paid</p>
          </div>
        </Link>
      </div>
    </div>
  );
};
