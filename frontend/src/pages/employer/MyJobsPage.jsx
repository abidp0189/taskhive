import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { PlusCircle, Layers, Pause, Play, XCircle, ArrowRight, Eye, Clock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const MyJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employer/jobs');
      if (res.data?.success) setJobs(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleAction = async (jobId, action) => {
    try {
      const res = await api.post(`/jobs/${jobId}/${action}`);
      if (res.data?.success) {
        toast.success(`Job ${action}d`);
        fetchJobs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} job`);
    }
  };

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Manage Employer Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Monitor worker submission progress, pause or resume live tasks, and review proofs.
          </p>
        </div>

        <Link
          to="/employer/jobs/new"
          className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-2.5 text-xs font-bold text-white shadow transition-all hover:scale-105"
        >
          <PlusCircle className="h-4 w-4" /> Post New Job
        </Link>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-3xl p-6 overflow-hidden border border-gray-800 space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">Loading your campaigns...</div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center">
            <Layers className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No campaigns created yet</h3>
            <p className="text-xs text-gray-400 mt-1">Post a job to start receiving real microtask proofs.</p>
            <Link
              to="/employer/jobs/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Post a Job →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Title / Category</th>
                  <th className="py-3 px-4">Worker Slots</th>
                  <th className="py-3 px-4">Reward</th>
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
                    <td className="py-3.5 px-4 text-gray-300">
                      {job.approvedWorkers || 0} approved / {job.totalWorkers} total
                      <div className="w-24 bg-gray-900 rounded-full h-1 mt-1 overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, Math.round(((job.approvedWorkers || 0) / job.totalWorkers) * 100))}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      ${parseFloat(job.rewardPerWorker).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge>{job.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/employer/jobs/${job.id}/submissions`}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow transition-colors"
                      >
                        Submissions ({job._count?.assignments || 0})
                      </Link>

                      {job.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleAction(job.id, 'pause')}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-amber-400 hover:bg-gray-800"
                          title="Pause Job"
                        >
                          <Pause className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {job.status === 'PAUSED' && (
                        <button
                          onClick={() => handleAction(job.id, 'resume')}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-emerald-400 hover:bg-gray-800"
                          title="Resume Job"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {['ACTIVE', 'PAUSED'].includes(job.status) && (
                        <button
                          onClick={() => handleAction(job.id, 'cancel')}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-rose-400 hover:bg-gray-800"
                          title="Cancel Job (Refunds unused budget)"
                        >
                          <XCircle className="h-3.5 w-3.5" />
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
    </div>
  );
};
