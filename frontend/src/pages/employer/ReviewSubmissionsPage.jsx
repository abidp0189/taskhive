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
  ExternalLink,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { ImageLightboxModal } from '../../components/common/ImageLightboxModal';
import api, { getFileUrl } from '../../services/api';
import toast from 'react-hot-toast';

export const ReviewSubmissionsPage = () => {
  const { id: jobId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [job, setJob] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('SUBMITTED');

  // Active review modal states
  const [selectedSub, setSelectedSub] = useState(null);
  const [actionType, setActionType] = useState(null); // 'reject' | 'resubmit'
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [signedUrlCache, setSignedUrlCache] = useState({});

  const resolveProofUrl = async (rawUrl) => {
    if (!rawUrl) return null;
    if (rawUrl.startsWith('data:') || rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('blob:')) {
      return rawUrl;
    }
    if (signedUrlCache[rawUrl]) return signedUrlCache[rawUrl];
    try {
      const res = await api.get(`/upload/signed-url?key=${encodeURIComponent(rawUrl)}`);
      if (res.data?.success) {
        const signedUrl = res.data.data.signedUrl;
        setSignedUrlCache((prev) => ({ ...prev, [rawUrl]: signedUrl }));
        return signedUrl;
      }
    } catch (e) {
      console.warn('[R2] Failed to get signed URL for:', rawUrl, e.message);
    }
    return null;
  };

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
        if (subsRes.value.data.pagination?.stats) {
          setStats(subsRes.value.data.pagination.stats);
        }
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

        {/* Rejection Limits & Statistics Banner */}
        {stats && (
          <div className="mt-6 pt-6 border-t border-gray-800 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800">
                <span className="text-gray-400 block text-[11px]">Total Submissions</span>
                <span className="text-base font-bold text-white mt-0.5 block">{stats.totalSubmissions}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40">
                <span className="text-emerald-400 block text-[11px]">Approved Submissions</span>
                <span className="text-base font-bold text-emerald-300 mt-0.5 block">{stats.approvedCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/40">
                <span className="text-rose-400 block text-[11px]">Rejected Submissions</span>
                <span className="text-base font-bold text-rose-300 mt-0.5 block">{stats.rejectedCount}</span>
              </div>
              <div className={`p-3 rounded-xl border ${
                stats.rejectionRate >= 40
                  ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                  : stats.rejectionRate >= 30
                  ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                  : 'bg-[var(--color-surface2)] border-[var(--color-border)] text-purple-700 dark:text-purple-300'
              }`}>
                <span className="block text-[11px] font-medium opacity-80">Rejection Rate (Max 40%)</span>
                <span className="text-base font-black mt-0.5 block">
                  {stats.rejectionRate}%
                  {stats.rejectionRate >= 40 && ' (Limit Reached)'}
                </span>
              </div>
            </div>

            {/* Threshold Warnings */}
            {stats.rejectionRate >= 40 ? (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 flex items-start gap-3 text-xs text-rose-200">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Rejection Limit Reached (40%)</h4>
                  <p className="mt-0.5 text-rose-300 leading-relaxed">
                    To maintain platform fairness for workers, an employer cannot reject more than 40% of submissions for a job.
                    Further rejections are <strong>locked</strong>. Please approve valid submissions or request resubmission if corrections are needed.
                  </p>
                </div>
              </div>
            ) : stats.rejectionRate >= 30 ? (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 flex items-start gap-3 text-xs text-amber-200">
                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Rejection Limit Warning</h4>
                  <p className="mt-0.5 text-amber-300">
                    Your rejection rate is at <strong>{stats.rejectionRate}%</strong>. The maximum allowed rejection threshold is <strong>40%</strong>. Please review carefully before rejecting further work.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}
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
                  {selectedSub.proofs?.map((p) => {
                    const imageUrl = p.fileUrl || (p.type === 'IMAGE' && p.content ? p.content : null);
                    const isUrl = p.type === 'URL' || (p.content && (p.content.startsWith('http://') || p.content.startsWith('https://')));
                    return (
                      <div key={p.id} className="p-4 rounded-2xl bg-gray-950 border border-gray-800 space-y-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">
                          Evidence Type: {p.type}
                        </span>
                        {p.content && !imageUrl && (
                          <p className="text-gray-200 bg-gray-900/80 p-3 rounded-xl border border-gray-800 text-xs select-all whitespace-pre-wrap">
                            {p.content}
                          </p>
                        )}
                        {imageUrl && (
                          <div className="mt-2 space-y-2">
                            <button
                              type="button"
                              onClick={async () => {
                                const url = await resolveProofUrl(imageUrl);
                                if (url) setLightboxImg(url);
                              }}
                              className="block w-full text-left group cursor-zoom-in"
                            >
                              <img
                                src={imageUrl?.startsWith('data:') ? imageUrl : undefined}
                                data-r2-key={!imageUrl?.startsWith('data:') ? imageUrl : undefined}
                                alt="Screenshot Proof"
                                className="max-h-80 w-full object-contain rounded-xl border border-gray-800 bg-black group-hover:border-indigo-500 transition-colors"
                                loading="lazy"
                                onError={(e) => {
                                  if (e.target.dataset.r2Key) {
                                    resolveProofUrl(e.target.dataset.r2Key).then((url) => { if (url) e.target.src = url; });
                                  }
                                }}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const url = await resolveProofUrl(imageUrl);
                                if (url) setLightboxImg(url);
                              }}
                              className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1.5 font-semibold"
                            >
                              View Fullscreen Screenshot <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        {isUrl && (
                          <div className="mt-1">
                            <a
                              href={p.content.startsWith('http') ? p.content : `https://${p.content}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1.5 font-semibold"
                            >
                              Open Submitted Link <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Bar */}
            {selectedSub.status === 'SUBMITTED' && !actionType && (
              <div className="pt-4 border-t border-[var(--color-border)] dark:border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionType('resubmit')}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold transition-colors w-full sm:w-auto cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Request Resubmission
                </button>

                <button
                  type="button"
                  disabled={stats?.isEmployerLimitReached || stats?.rejectionRate >= 40}
                  onClick={() => setActionType('reject')}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto cursor-pointer"
                  title={stats?.isEmployerLimitReached ? 'Rejection limit (40%) reached' : 'Reject Work'}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {stats?.isEmployerLimitReached || stats?.rejectionRate >= 40 ? 'Rejection Locked (40% Limit)' : 'Reject Work'}
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleApprove(selectedSub.id)}
                  className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold shadow-lg disabled:opacity-50 transition-all w-full sm:w-auto cursor-pointer"
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

      {/* Fullscreen Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={!!lightboxImg}
        onClose={() => setLightboxImg(null)}
        src={lightboxImg}
        title="Worker Submission Screenshot"
      />
    </div>
  );
};
