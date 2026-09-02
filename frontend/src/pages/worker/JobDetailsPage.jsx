import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { 
  Briefcase, 
  Clock, 
  Coins, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  FileText, 
  Link as LinkIcon, 
  ExternalLink, 
  ShieldCheck, 
  ArrowLeft,
  X
} from 'lucide-react';
import { ImageLightboxModal } from '../../components/common/ImageLightboxModal';
import api, { getFileUrl } from '../../services/api';
import toast from 'react-hot-toast';

export const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);

  // Proof form state
  const [textProof, setTextProof] = useState('');
  const [urlProof, setUrlProof] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [lightboxImg, setLightboxImg] = useState(null);
  // Cache of resolved signed URLs for R2 object keys: { [objectKey]: signedUrl }
  const [signedUrlCache, setSignedUrlCache] = useState({});

  /**
   * Resolve a proof image URL.
   * - If it starts with 'data:' or 'http', use as-is.
   * - Otherwise treat it as an R2 object key and fetch a signed GET URL.
   */
  const resolveProofUrl = async (rawUrl) => {
    if (!rawUrl) return null;
    if (rawUrl.startsWith('data:') || rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('blob:')) {
      return rawUrl;
    }
    // R2 object key — check cache first
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

  const fetchJobDetails = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      if (res.data?.success) {
        setJob(res.data.data);
        if (res.data.data.userAssignment) {
          // fetch full assignment
          const taskRes = await api.get(`/tasks/${res.data.data.userAssignment.id}`);
          if (taskRes.data?.success) {
            setTask(taskRes.data.data);
          }
        }
      }
    } catch (err) {
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'EMPLOYER') {
      toast.error('Employers cannot view full job details or complete tasks.');
      navigate('/employer/dashboard', { replace: true });
      return;
    }
    fetchJobDetails();
  }, [id, user]);

  const handleStartTask = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setStarting(true);
    try {
      const res = await api.post(`/jobs/${id}/start`);
      if (res.data?.success) {
        toast.success('Task started! Slot reserved for 48 hours.');
        fetchJobDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start task');
    } finally {
      setStarting(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!task) return;

    if (!textProof && !urlProof && selectedFiles.length === 0) {
      toast.error('Please provide at least one proof item (text, URL, or screenshot)');
      return;
    }

    setSubmitting(true);
    try {
      const proofs = [];
      if (textProof.trim()) {
        proofs.push({ type: 'TEXT', content: textProof.trim() });
      }
      if (urlProof.trim()) {
        proofs.push({ type: 'URL', content: urlProof.trim() });
      }

      for (const file of selectedFiles) {
        let objectKey = null;

        // ── Try R2 presigned upload (production path) ──────────────────────
        try {
          const presignRes = await api.post('/upload/presign', {
            filename: file.name,
            contentType: file.type || 'image/png',
            size: file.size,
            taskId: task.id,
          });

          if (presignRes.data?.success) {
            const { presignedUrl, objectKey: key } = presignRes.data.data;
            // Direct PUT to R2 — file bytes never pass through our API server
            await fetch(presignedUrl, {
              method: 'PUT',
              headers: { 'Content-Type': file.type || 'image/png' },
              body: file,
            });
            objectKey = key;
          }
        } catch (r2Err) {
          // R2 not configured (local dev) — fall back to base64
          console.warn('[Upload] R2 not available, falling back to base64:', r2Err.message);
        }

        if (objectKey) {
          // Production path: store only the R2 object key reference
          proofs.push({
            type: file.type.startsWith('image/') ? 'IMAGE' : 'FILE',
            content: objectKey,
            fileUrl: objectKey,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'image/png',
          });
        } else {
          // Dev fallback: base64 encode in browser
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          proofs.push({
            type: file.type.startsWith('image/') ? 'IMAGE' : 'FILE',
            content: base64,
            fileUrl: base64,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'image/png',
          });
        }
      }

      const res = await api.post(`/tasks/${task.id}/submit`, { proofs });

      if (res.data?.success) {
        toast.success('Proof submitted successfully! Awaiting review.');
        setSelectedFiles([]);
        setFilePreviews([]);
        setTextProof('');
        setUrlProof('');
        fetchJobDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-gray-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto mb-3" />
        Loading job details...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-lg font-bold text-white">Job not found</h2>
        <Link to="/jobs" className="text-xs text-indigo-400 mt-2 inline-block">Back to jobs</Link>
      </div>
    );
  }

  const isReservedOrInProgress = task && ['RESERVED', 'IN_PROGRESS', 'RESUBMIT_REQUIRED'].includes(task.status);
  const isSubmittedOrFinished = task && ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(task.status);

  return (
    <div className="py-8 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Back button */}
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to all jobs
      </Link>

      {/* Main Job Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Title & Reward Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950/80 border border-indigo-800/80 text-indigo-300">
                {job.category?.name}
              </span>
              {task && <Badge>{task.status}</Badge>}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {job.title}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Posted by <span className="text-gray-200 font-medium">{job.employer?.name || 'Employer'}</span>
            </p>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Worker Payout</span>
            <span className="text-3xl font-black text-emerald-400">
              ${parseFloat(job.rewardPerWorker).toFixed(2)}
            </span>
            <span className="text-[11px] text-gray-500 mt-0.5">
              {job.totalWorkers - job.completedWorkers} slots available
            </span>
          </div>
        </div>

        {/* Quick Highlights Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-950/60 border border-gray-800/80 text-xs">
          <div>
            <span className="text-gray-500 block">Required Proof</span>
            <span className="font-semibold text-gray-300">{job.proofTypes || 'Screenshot & Text'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Time Limit</span>
            <span className="font-semibold text-gray-300">48 Hours</span>
          </div>
          <div>
            <span className="text-gray-500 block">Target Location</span>
            <span className="font-semibold text-gray-300">Global</span>
          </div>
          <div>
            <span className="text-gray-500 block">Escrow Status</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Funded
            </span>
          </div>
        </div>

        {/* Task Instructions */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-400" /> Step-by-Step Instructions
          </h3>
          <div className="p-5 rounded-2xl bg-gray-950/80 border border-gray-800 text-xs sm:text-sm text-gray-300 whitespace-pre-line leading-relaxed">
            {job.instructions}
          </div>
          {job.targetUrl && (
            <a
              href={job.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Open Target Website / Link <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Required Proof Brief */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-purple-400" /> What to Submit as Proof
          </h3>
          <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-900/40 text-xs sm:text-sm text-purple-200 leading-relaxed">
            {job.proofRequirements}
          </div>
        </div>

        {/* Action / State Area */}
        {!task ? (
          <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              Clicking "Start Task" will reserve your worker slot for 48 hours.
            </p>
            <button
              onClick={handleStartTask}
              disabled={starting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all hover:scale-105"
            >
              {starting ? 'Reserving slot...' : 'Start Task Now & Reserve Slot'}
            </button>
          </div>
        ) : isReservedOrInProgress ? (
          /* Proof Submission Form */
          <div className="pt-6 border-t border-gray-800 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-indigo-400" /> Submit Your Task Proof
              </h3>
              <Badge variant="warning">{task.status}</Badge>
            </div>

            {task.status === 'RESUBMIT_REQUIRED' && (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/60 text-xs text-amber-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Resubmission Requested:</p>
                  <p className="mt-0.5 text-amber-300">{task.rejectionReason}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitProof} className="space-y-4">
              {/* Text answer / username proof */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Text Answer / Username / ID Proof
                </label>
                <textarea
                  rows={3}
                  value={textProof}
                  onChange={(e) => setTextProof(e.target.value)}
                  placeholder="Enter requested usernames, transaction IDs, or answers..."
                  className="w-full rounded-xl bg-gray-950/80 border border-gray-800 p-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* URL proof */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Proof Link / URL (Optional)
                </label>
                <div className="relative">
                  <LinkIcon className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center h-full text-gray-500 w-4" />
                  <input
                    type="url"
                    value={urlProof}
                    onChange={(e) => setUrlProof(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl bg-gray-950/80 border border-gray-800 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Screenshot / File upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Upload Screenshot Evidence (Images/PDF, max 10MB)
                </label>
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-800 hover:border-indigo-500/50 rounded-2xl bg-gray-950/40 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <UploadCloud className="h-8 w-8 text-gray-500 mb-2" />
                  <p className="text-xs font-semibold text-gray-300">Click or drag screenshots here</p>
                  <p className="text-[10px] text-gray-500 mt-1">PNG, JPG, WEBP, or PDF</p>
                </div>

                {/* Previews */}
                {filePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {filePreviews.map((preview, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-gray-800 h-24 bg-gray-900 group">
                        <img src={preview} alt="Proof" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all hover:scale-105"
              >
                {submitting ? 'Uploading Proof...' : 'Submit Proof for Review'}
              </button>
            </form>
          </div>
        ) : (
          /* Already Submitted or Finished */
          <div className="pt-6 border-t border-gray-800 space-y-4">
            <div className="p-4 rounded-2xl bg-gray-950/60 border border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Current Task Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge>{task.status}</Badge>
                  {task.status === 'APPROVED' && (
                    <span className="text-xs font-semibold text-emerald-400">
                      +${parseFloat(task.rewardAmount).toFixed(2)} Credited to your wallet
                    </span>
                  )}
                </div>
              </div>
              <Link to="/my-tasks" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                View in My Tasks →
              </Link>
            </div>

            {task.proofs && task.proofs.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-300">Your Submitted Evidence:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.proofs.map((p) => {
                    const imageUrl = p.fileUrl || (p.type === 'IMAGE' && p.content ? p.content : null);
                    const isUrl = p.type === 'URL' || (p.content && (p.content.startsWith('http://') || p.content.startsWith('https://')));
                    return (
                      <div key={p.id} className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 text-xs space-y-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">{p.type}</span>
                        {p.content && !imageUrl && <p className="text-gray-300 select-all whitespace-pre-wrap">{p.content}</p>}
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
                                alt="Uploaded proof"
                                className="max-h-48 w-full object-contain rounded-lg border border-gray-800 bg-black/60 group-hover:border-indigo-500 transition-colors"
                                loading="lazy"
                                onLoad={(e) => {
                                  // If src not yet set and we have an R2 key, resolve it
                                  if (!e.target.src && e.target.dataset.r2Key) {
                                    resolveProofUrl(e.target.dataset.r2Key).then((url) => {
                                      if (url) e.target.src = url;
                                    });
                                  }
                                }}
                                onError={(e) => {
                                  if (e.target.dataset.r2Key) {
                                    resolveProofUrl(e.target.dataset.r2Key).then((url) => {
                                      if (url) e.target.src = url;
                                    });
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={!!lightboxImg}
        onClose={() => setLightboxImg(null)}
        src={lightboxImg}
        title="Submitted Screenshot Evidence"
      />
    </div>
  );
};
