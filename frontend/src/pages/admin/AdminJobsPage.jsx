import React, { useState, useEffect } from 'react';
import { Badge } from '../../components/common/Badge';
import { Layers, CheckCircle2, XCircle, Pause, Play } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const AdminJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/admin/jobs?status=${statusFilter}` : '/admin/jobs';
      const res = await api.get(url);
      if (res.data?.success) setJobs(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const handleUpdateStatus = async (jobId, status) => {
    const reason = status === 'REJECTED' ? prompt('Enter reason for rejecting job:') : '';
    if (status === 'REJECTED' && !reason) return;

    try {
      const res = await api.patch(`/admin/jobs/${jobId}/status`, { status, reason });
      if (res.data?.success) {
        toast.success(`Job updated to ${status}`);
        fetchJobs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update job');
    }
  };

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Job Moderation & Queue
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Approve pending microtask campaigns, reject violating tasks, and monitor active jobs.
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'COMPLETED', 'REJECTED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              statusFilter === s
                ? 'bg-purple-600 text-white'
                : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {s ? s.replace('_', ' ') : 'All Campaigns'}
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-3xl p-6 overflow-hidden border border-gray-800 space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">No campaigns found matching filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Title / Employer</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Slots</th>
                  <th className="py-3 px-4">Reward</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white max-w-xs truncate">
                      {job.title}
                      <span className="block text-[11px] text-gray-400 font-normal">
                        Employer: {job.employer?.name} ({job.employer?.email})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-300">{job.category?.name}</td>
                    <td className="py-3.5 px-4 text-gray-300">{job.totalWorkers} workers</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">${parseFloat(job.rewardPerWorker).toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <Badge>{job.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {job.status === 'PENDING_REVIEW' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(job.id, 'ACTIVE')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(job.id, 'REJECTED')}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {job.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleUpdateStatus(job.id, 'PAUSED')}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-amber-400 hover:bg-gray-800"
                        >
                          Pause
                        </button>
                      )}
                      {job.status === 'PAUSED' && (
                        <button
                          onClick={() => handleUpdateStatus(job.id, 'ACTIVE')}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-emerald-400 hover:bg-gray-800"
                        >
                          Resume
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
