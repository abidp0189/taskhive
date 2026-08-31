import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  Users, 
  Briefcase, 
  ArrowRight, 
  TrendingUp, 
  AlertCircle,
  Zap
} from 'lucide-react';
import api from '../../services/api';

export const WorkerDashboard = () => {
  const { user, wallet } = useAuth();
  const [activeTasks, setActiveTasks] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tasksRes, jobsRes] = await Promise.allSettled([
          api.get('/tasks?limit=4'),
          api.get('/jobs?limit=5&sort=newest')
        ]);

        if (tasksRes.status === 'fulfilled' && tasksRes.value.data?.success) {
          setActiveTasks(tasksRes.value.data.data);
        }
        if (jobsRes.status === 'fulfilled' && jobsRes.value.data?.success) {
          setRecommendedJobs(jobsRes.value.data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const completedCount = activeTasks.filter(t => t.status === 'APPROVED').length;
  const pendingCount = activeTasks.filter(t => ['SUBMITTED', 'IN_PROGRESS', 'RESUBMIT_REQUIRED'].includes(t.status)).length;

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6 sm:p-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Hello, <span className="gradient-text">{user?.name}</span> 👋
            </h1>
            <Badge variant="primary">Worker</Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Track your tasks, submit proofs, and monitor your wallet earnings in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/jobs"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-purple-500 transition-all"
          >
            <Zap className="h-4 w-4" /> Find Jobs
          </Link>
          <Link
            to="/withdraw"
            className="flex items-center gap-2 rounded-xl bg-gray-900 border border-gray-800 px-5 py-2.5 text-xs font-semibold text-gray-200 hover:bg-gray-800 hover:text-white transition-all"
          >
            <Wallet className="h-4 w-4 text-emerald-400" /> Withdraw
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Available Earnings"
          value={`$${parseFloat(wallet?.availableBalance || 0).toFixed(2)}`}
          subtitle="Ready for withdrawal"
          icon={Wallet}
          color="emerald"
        />
        <StatCard
          title="Tasks In Progress"
          value={pendingCount}
          subtitle="Awaiting completion/review"
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Approved Tasks"
          value={completedCount}
          subtitle="Lifetime approved work"
          icon={CheckCircle2}
          color="purple"
        />
        <StatCard
          title="Referral Network"
          value="5% Commission"
          subtitle="Lifetime passive income"
          icon={Users}
          color="amber"
        />
      </div>

      {/* Main Content 2-Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Tasks & Recent History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" /> Recent Tasks
              </h2>
              <Link to="/my-tasks" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-gray-500">Loading tasks...</div>
            ) : activeTasks.length === 0 ? (
              <div className="py-12 text-center">
                <Briefcase className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium">No tasks started yet.</p>
                <Link to="/jobs" className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
                  Browse available jobs to get started →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/80">
                {activeTasks.map((task) => (
                  <div key={task.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">{task.job?.title}</h4>
                        <Badge>{task.status}</Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Reward: <span className="text-emerald-400 font-semibold">${parseFloat(task.rewardAmount).toFixed(2)}</span> • Category: {task.job?.category?.name || 'General'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {['IN_PROGRESS', 'RESUBMIT_REQUIRED'].includes(task.status) && (
                        <Link
                          to={`/jobs/${task.job?.id}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
                        >
                          Submit Proof
                        </Link>
                      )}
                      <Link
                        to={`/my-tasks`}
                        className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 text-xs font-medium transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recommended Jobs Quick View */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400" /> New Jobs
              </h2>
              <Link to="/jobs" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                More
              </Link>
            </div>

            <div className="space-y-3">
              {recommendedJobs.slice(0, 4).map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="block glass-card rounded-2xl p-4 hover:border-indigo-500/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {job.title}
                    </h4>
                    <span className="text-xs font-extrabold text-emerald-400 shrink-0">
                      ${parseFloat(job.rewardPerWorker).toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                    <span>{job.category?.name}</span>
                    <span className="text-gray-500">
                      {job.totalWorkers - job.completedWorkers} slots left
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Referral Banner */}
          <div className="glass-card rounded-3xl p-6 border-indigo-900/50 bg-gradient-to-br from-indigo-950/40 to-purple-950/30">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400" /> Earn 5% Commission
            </h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Invite friends to work on Tomar Kaj. You earn a 5% commission on all their approved tasks forever.
            </p>
            <Link
              to="/referral"
              className="mt-4 block text-center rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 py-2 text-xs font-semibold text-indigo-300 transition-colors"
            >
              Get My Referral Link →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
