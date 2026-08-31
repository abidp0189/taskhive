import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Eye, 
  User, 
  Clock, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import api, { getFileUrl } from '../../services/api';
import toast from 'react-hot-toast';

export const ReviewSubmissionsPage = () => {
  const { id: jobId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('SUBMITTED');

  // Active review modal states
  const [selectedSub, setSelectedSub] = useState(null);
  const [actionType, setActionType] = useState(null); // 'reject' | 'resubmit'
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const [jobRes, subsRes] = await Promise.allSettled([
        api.get(`/jobs/${jobId}`),
        api.get(`/tasks/employer/jobs/${jobId}/submissions?status=${statusFilter}`)
      ]);

      if (jobRes.status === 'fulfilled' && jobRes.value.data?.success) {
        setJob(jobRes.value.data.data);
      }
      if (subsRes.status === 'fulfilled' && subsRes.value.data?.success) {
        setSubmissions(subsRes.value.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [jobId, statusFilter]);

  const handleApprove = async (subId) => {
    setProcessing(true);
    try {
      const res = await api.post(`/tasks/submissions/${subId}/approve`);
      if (res.data?.success) {
        toast.success('Submission approved! Reward credited to worker.');
        setSelectedSub(null);
        fetchSubmissions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectOrResubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason / note');
      return;
    }

    setProcessing(true);
    try {
      const endpoint = actionType === 'reject'
        ? `/tasks/submissions/${selectedSub.id}/reject`
        : `/tasks/submissions/${selectedSub.id}/resubmit-request`;

      const res = await api.post(endpoint, { reason: reason.trim() });
      if (res.data?.success) {
        toast.success(`Submission ${actionType === 'reject' ? 'rejected' : 'sent for resubmission'}`);
        setSelectedSub(null);
        setActionType(null);
        setReason('');
        fetchSubmissions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const tabs = [
    { label: 'Pending Review', value: 'SUBMITTED' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Resubmit Requested', value: 'RESUBMIT_REQUIRED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Back button */}
      <Link to="/employer/jobs" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to My Campaigns
      </Link>

      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Proof Verification</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {job?.title || 'Review Worker Submissions'}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Reward: <span className="text-emerald-400 font-bold">${parseFloat(job?.rewardPerWorker || 0).toFixed(2)}</span> • {job?.approvedWorkers || 0}/{job?.totalWorkers} approved
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Submissions List Table */}
      <div className="glass-panel rounded-3xl p-6 overflow-hidden border border-gray-800 space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">
            No submissions found in this status category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Worker</th>
                  <th className="py-3 px-4">Submitted Proofs</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-purple-900/60 text-purple-300 flex items-center justify-center font-bold text-[10px]">
                          {sub.worker?.name?.charAt(0) || 'W'}
                        </div>
                        <div>
                          <span>{sub.worker?.name}</span>
                          <span className="block text-[10px] text-gray-500">{sub.worker?.country?.name || 'Global'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-300">
                      {sub.proofs?.length || 0} proof items attached
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge>{sub.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedSub(sub)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow transition-colors"
                      >
                        Inspect & Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proof Inspection & Action Modal */}
      <Modal
        isOpen={!!selectedSub}
        onClose={() => { setSelectedSub(null); setActionType(null); }}
        title={`Submission Evidence — ${selectedSub?.worker?.name || 'Worker'}`}
        maxWidth="max-w-2xl"
      >
        {selectedSub && (
          <div className="space-y-6 text-xs">
            {/* Header info */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800">
              <div>
                <span className="text-gray-500 text-[10px] block">Worker</span>
                <span className="font-bold text-white">{selectedSub.worker?.name}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Current Status</span>
                <Badge>{selectedSub.status}</Badge>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Reward Upon Approval</span>
                <span className="font-bold text-emerald-400 text-sm">
                  ${parseFloat(selectedSub.rewardAmount).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Proofs rendering */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-200">Submitted Evidence:</h4>
              {selectedSub.proofs?.length === 0 ? (
                <p className="text-gray-500 py-4 text-center">No proofs found</p>
              ) : (
                <div className="space-y-4">
                  {selectedSub.proofs?.map((p) => (
                    <div key={p.id} className="p-4 rounded-2xl bg-gray-950 border border-gray-800 space-y-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">
                        Evidence Type: {p.type}
                      </span>
                      {p.content && (
                        <p className="text-gray-200 bg-gray-900/80 p-3 rounded-xl border border-gray-800 text-xs select-all whitespace-pre-wrap">
                          {p.content}
                        </p>
                      )}
                      {p.fileUrl && (
                        <div className="mt-2 space-y-2">
                          <img
                            src={getFileUrl(p.fileUrl)}
                            alt="Screenshot Proof"
                            className="max-h-80 w-full object-contain rounded-xl border border-gray-800 bg-black"
                            loading="lazy"
                          />
                          <a
                            href={getFileUrl(p.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            Open Original Screenshot <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Bar */}
            {selectedSub.status === 'SUBMITTED' && !actionType && (
              <div className="pt-4 border-t border-gray-800 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionType('resubmit')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 hover:bg-amber-900 font-semibold transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Request Resubmission
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('reject')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:bg-rose-900 font-semibold transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject Work
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleApprove(selectedSub.id)}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all hover:scale-105"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {processing ? 'Processing...' : 'Approve & Release Reward'}
                </button>
              </div>
            )}

            {/* Reject / Resubmit Reason Form */}
            {actionType && (
              <div className="pt-4 border-t border-gray-800 space-y-3">
                <h4 className="font-bold text-white">
                  {actionType === 'reject' ? 'Rejection Reason (Required)' : 'Resubmission Instructions (Required)'}
                </h4>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={actionType === 'reject' ? 'Explain why this submission is rejected...' : 'Explain what the worker needs to fix and resubmit...'}
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-3 text-xs text-white focus:border-purple-500 focus:outline-none"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType(null)}
                    className="px-4 py-2 rounded-xl bg-gray-900 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleRejectOrResubmit}
                    className={`px-5 py-2 rounded-xl font-bold text-white transition-colors ${
                      actionType === 'reject' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500'
                    }`}
                  >
                    {processing ? 'Submitting...' : actionType === 'reject' ? 'Confirm Rejection' : 'Send Resubmission Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
