import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { 
  Briefcase, 
  Users, 
  Clock, 
  DollarSign, 
  PlusCircle, 
  ArrowRight, 
  Layers, 
  ShieldCheck 
} from 'lucide-react';
import api from '../../services/api';

export const EmployerDashboard = () => {
  const { user, wallet, refreshWallet } = useAuth();
  const [activeTab, setActiveTab] = useState('my_jobs'); // 'my_jobs' | 'explore_jobs'
  const [jobs, setJobs] = useState([]);
  const [exploreJobs, setExploreJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exploreLoading, setExploreLoading] = useState(false);

  useEffect(() => {
    refreshWallet();
    api.get('/employer/jobs?limit=5')
      .then((res) => {
        if (res.data?.success) setJobs(res.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchExploreJobs = async () => {
    if (exploreJobs.length > 0) return;
    setExploreLoading(true);
    try {
      const res = await api.get('/jobs?limit=10&sort=newest');
      if (res.data?.success) {
        setExploreJobs(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExploreLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'explore_jobs') {
      fetchExploreJobs();
    }
  };

  const activeJobsCount = jobs.filter(j => j.status === 'ACTIVE').length;
  const pendingReviewJobs = jobs.filter(j => j.status === 'PENDING_REVIEW').length;

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6 sm:p-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Employer Portal, <span className="gradient-text">{user?.name}</span>
            </h1>
            <Badge variant="purple">Employer</Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Launch targeted microtask campaigns, inspect worker submissions, and scale real user engagement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/employer/jobs/new"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 transition-all hover:scale-105"
          >
            <PlusCircle className="h-4 w-4" /> Create New Job
          </Link>
          <Link
            to="/employer/wallet"
            className="flex items-center gap-2 rounded-xl bg-gray-900 border border-gray-800 px-5 py-2.5 text-xs font-semibold text-gray-200 hover:bg-gray-800 hover:text-white transition-all"
          >
            <DollarSign className="h-4 w-4 text-purple-400" /> Deposit Funds
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Deposit Wallet Balance"
          value={`$${parseFloat(wallet?.depositBalance || 0).toFixed(2)}`}
          subtitle="Available to fund new campaigns"
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Locked in Active Escrow"
          value={`$${parseFloat(wallet?.lockedBalance || 0).toFixed(2)}`}
          subtitle="Reserved for worker rewards"
          icon={ShieldCheck}
          color="indigo"
        />
        <StatCard
          title="Active Campaigns"
          value={activeJobsCount}
          subtitle="Live and accepting submissions"
          icon={Briefcase}
          color="emerald"
        />
        <StatCard
          title="Pending Campaign Reviews"
          value={pendingReviewJobs}
          subtitle="Awaiting admin approval"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Posted Campaigns / Explore Jobs Panel */}
      <div className="glass-panel rounded-3xl p-6 overflow-hidden border border-gray-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTabChange('my_jobs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'my_jobs'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-850/50'
              }`}
            >
              <Layers className="h-4 w-4 text-purple-400" /> My Job Campaigns
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('explore_jobs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'explore_jobs'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-850/50'
              }`}
            >
              <Briefcase className="h-4 w-4 text-indigo-400" /> Explore Jobs
            </button>
          </div>

          {activeTab === 'my_jobs' && (
            <Link to="/employer/jobs" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              View All My Jobs →
            </Link>
          )}
        </div>

        {activeTab === 'my_jobs' ? (
          loading ? (
            <div className="py-12 text-center text-xs text-gray-500">Loading employer jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="py-12 text-center">
              <Briefcase className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-400">You haven't posted any jobs yet.</p>
              <Link
                to="/employer/jobs/new"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-semibold text-white transition-colors"
              >
                <PlusCircle className="h-4 w-4" /> Create Your First Campaign
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Campaign Title</th>
                    <th className="py-3 px-4">Progress / Slots</th>
                    <th className="py-3 px-4">Reward / Worker</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white max-w-xs truncate">
                        {job.title}
                        <span className="block text-[11px] text-gray-400 font-normal">{job.category?.name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-gray-300 font-medium">
                          {job.approvedWorkers || 0} / {job.totalWorkers} approved
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        ${parseFloat(job.rewardPerWorker).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge>{job.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/employer/jobs/${job.id}/submissions`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow transition-colors"
                        >
                          Review Proofs
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Explore Jobs Tab (Browse-only, no detail view or actions for employers) */
          <div>
            <div className="p-3 mb-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-300 flex items-center justify-between">
              <span>Browsing active marketplace jobs. (Summary view only — job submission and full instructions are for workers).</span>
              <span className="font-semibold text-gray-400">{exploreJobs.length} jobs shown</span>
            </div>

            {exploreLoading ? (
              <div className="py-12 text-center text-xs text-gray-500">Loading marketplace jobs...</div>
            ) : exploreJobs.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">No active marketplace jobs currently available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Job Title</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Reward</th>
                      <th className="py-3 px-4">Total Workers</th>
                      <th className="py-3 px-4 text-right">Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {exploreJobs.map((ej) => (
                      <tr key={ej.id} className="hover:bg-gray-850/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white max-w-sm">
                          <p className="truncate">{ej.title}</p>
                          {ej.shortDescription && (
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">{ej.shortDescription}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-300">
                          <span className="px-2 py-0.5 rounded-md text-[10px] bg-gray-900 border border-gray-800 text-gray-300">
                            {ej.category?.name || 'General'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400">
                          ${parseFloat(ej.rewardPerWorker).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-gray-300">
                          {ej.totalWorkers} slots
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-[11px] text-gray-500 italic bg-gray-900/60 px-2.5 py-1 rounded-lg border border-gray-800">
                            Browse Only
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
