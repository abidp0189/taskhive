import React, { useState, useEffect, useRef } from 'react';
import { 
  Megaphone, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Upload, 
  Save, 
  X,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Badge } from '../../components/common/Badge';

export const AdminPromotionsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Announcement Form State
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  // Advertisement Form State
  const [adTitle, setAdTitle] = useState('Paid');
  const [adUrl, setAdUrl] = useState('');
  const [adActive, setAdActive] = useState(true);
  const [adFile, setAdFile] = useState(null);
  const [adPreview, setAdPreview] = useState(null);
  const [submittingAd, setSubmittingAd] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [editAdFile, setEditAdFile] = useState(null);
  const [editAdPreview, setEditAdPreview] = useState(null);

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const fetchData = async () => {
    try {
      const [annRes, adRes] = await Promise.all([
        api.get('/promotions/admin/announcements'),
        api.get('/promotions/admin/advertisements'),
      ]);
      if (annRes.data?.success) setAnnouncements(annRes.data.data);
      if (adRes.data?.success) setAdvertisements(adRes.data.data);
    } catch (err) {
      toast.error('Failed to load promotions data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ─────────────────────────────────────────────
  // ANNOUNCEMENT HANDLERS
  // ─────────────────────────────────────────────
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementMsg.trim()) {
      toast.error('Announcement message cannot be empty');
      return;
    }
    setSubmittingAnnouncement(true);
    try {
      const res = await api.post('/promotions/admin/announcements', {
        message: announcementMsg.trim(),
        isActive: announcementActive,
      });
      if (res.data?.success) {
        toast.success('Announcement published');
        setAnnouncementMsg('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create announcement');
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  const handleToggleAnnouncement = async (ann) => {
    try {
      const res = await api.patch(`/promotions/admin/announcements/${ann.id}`, {
        isActive: !ann.isActive,
      });
      if (res.data?.success) {
        toast.success(ann.isActive ? 'Announcement deactivated' : 'Announcement activated');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to update announcement status');
    }
  };

  const handleSaveEditAnnouncement = async (e) => {
    e.preventDefault();
    if (!editingAnnouncement?.message?.trim()) {
      toast.error('Message is required');
      return;
    }
    try {
      const res = await api.patch(`/promotions/admin/announcements/${editingAnnouncement.id}`, {
        message: editingAnnouncement.message.trim(),
        isActive: editingAnnouncement.isActive,
      });
      if (res.data?.success) {
        toast.success('Announcement updated');
        setEditingAnnouncement(null);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await api.delete(`/promotions/admin/announcements/${id}`);
      if (res.data?.success) {
        toast.success('Announcement deleted');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  // ─────────────────────────────────────────────
  // ADVERTISEMENT HANDLERS
  // ─────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, and WEBP images are supported');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be 5MB or less');
      return;
    }

    setAdFile(file);
    setAdPreview(URL.createObjectURL(file));
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, and WEBP images are supported');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be 5MB or less');
      return;
    }

    setEditAdFile(file);
    setEditAdPreview(URL.createObjectURL(file));
  };

  const handleCreateAdvertisement = async (e) => {
    e.preventDefault();
    if (!adFile) {
      toast.error('Please select an advertisement banner image');
      return;
    }
    if (!adUrl.trim()) {
      toast.error('Destination URL is required');
      return;
    }

    setSubmittingAd(true);
    try {
      // 1. Upload image securely
      const formData = new FormData();
      formData.append('image', adFile);

      const uploadRes = await api.post('/promotions/admin/advertisements/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!uploadRes.data?.success) {
        throw new Error(uploadRes.data?.message || 'Failed to upload image');
      }

      const { imageUrl, imageKey } = uploadRes.data.data;

      // 2. Create Advertisement record
      const adRes = await api.post('/promotions/admin/advertisements', {
        title: adTitle.trim() || 'Paid',
        destinationUrl: adUrl.trim(),
        imageUrl,
        imageKey,
        isActive: adActive,
      });

      if (adRes.data?.success) {
        toast.success('Advertisement created successfully');
        setAdFile(null);
        setAdPreview(null);
        setAdUrl('');
        setAdTitle('Paid');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create advertisement');
    } finally {
      setSubmittingAd(false);
    }
  };

  const handleToggleAd = async (ad) => {
    try {
      const res = await api.patch(`/promotions/admin/advertisements/${ad.id}`, {
        isActive: !ad.isActive,
      });
      if (res.data?.success) {
        toast.success(ad.isActive ? 'Advertisement deactivated' : 'Advertisement activated');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to update advertisement status');
    }
  };

  const handleSaveEditAd = async (e) => {
    e.preventDefault();
    if (!editingAd?.destinationUrl?.trim()) {
      toast.error('Destination URL is required');
      return;
    }

    setSubmittingAd(true);
    try {
      let imageUrl = editingAd.imageUrl;
      let imageKey = editingAd.imageKey;

      // If user selected a replacement image, upload it first
      if (editAdFile) {
        const formData = new FormData();
        formData.append('image', editAdFile);

        const uploadRes = await api.post('/promotions/admin/advertisements/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadRes.data?.success) {
          imageUrl = uploadRes.data.data.imageUrl;
          imageKey = uploadRes.data.data.imageKey;
        } else {
          throw new Error('Failed to upload replacement image');
        }
      }

      const res = await api.patch(`/promotions/admin/advertisements/${editingAd.id}`, {
        title: editingAd.title?.trim() || 'Paid',
        destinationUrl: editingAd.destinationUrl.trim(),
        imageUrl,
        imageKey,
        isActive: editingAd.isActive,
      });

      if (res.data?.success) {
        toast.success('Advertisement updated successfully');
        setEditingAd(null);
        setEditAdFile(null);
        setEditAdPreview(null);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update advertisement');
    } finally {
      setSubmittingAd(false);
    }
  };

  const handleDeleteAd = async (id) => {
    if (!window.confirm('Are you sure you want to delete this advertisement? Its image will be cleaned up.')) return;
    try {
      const res = await api.delete(`/promotions/admin/advertisements/${id}`);
      if (res.data?.success) {
        toast.success('Advertisement and associated image removed');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to delete advertisement');
    }
  };

  return (
    <div className="py-8 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Promotions & Announcements
          </h1>
          <Badge variant="danger">Admin</Badge>
        </div>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Manage worker dashboard announcements and advertisements with real-time updates and secure image validation.
        </p>
      </div>

      {/* ─────────────────────────────────────────────
          SECTION 1: ANNOUNCEMENT MANAGEMENT
      ───────────────────────────────────────────── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-950/80 border border-purple-800 text-purple-400 flex items-center justify-center">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Worker Dashboard Announcements</h2>
              <p className="text-xs text-gray-400">Supports Bangla, English, Unicode, and Emoji.</p>
            </div>
          </div>
        </div>

        {/* Create Announcement Form */}
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Announcement Message
            </label>
            <textarea
              rows={2}
              value={announcementMsg}
              onChange={(e) => setAnnouncementMsg(e.target.value)}
              placeholder="e.g. 📢 নতুন Update — আজকের নতুন কাজগুলো এখন Available!"
              className="w-full rounded-2xl bg-gray-950/90 border border-gray-800 p-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-all shadow-inner"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={announcementActive}
                onChange={(e) => setAnnouncementActive(e.target.checked)}
                className="rounded border-gray-700 text-purple-600 focus:ring-purple-500"
              />
              <span>Set as active immediately (shown to workers)</span>
            </label>

            <button
              type="submit"
              disabled={submittingAnnouncement}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {submittingAnnouncement ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </form>

        {/* Announcement List */}
        <div className="pt-4 border-t border-gray-800/80">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Existing Announcements ({announcements.length})
          </h3>

          {loading ? (
            <div className="py-8 text-center text-xs text-gray-500">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">No announcements created yet.</div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 rounded-2xl bg-gray-950/60 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-gray-700"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-white break-words">
                      {ann.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
                      <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAnnouncement(ann)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                          ann.isActive
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : 'bg-gray-900 text-gray-500 border border-gray-800 hover:text-gray-300'
                        }`}
                      >
                        {ann.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {ann.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setEditingAnnouncement(ann)}
                      className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors cursor-pointer"
                      title="Edit Announcement"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 hover:text-rose-300 border border-rose-800/40 transition-colors cursor-pointer"
                      title="Delete Announcement"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          SECTION 2: ADVERTISEMENT MANAGEMENT
      ───────────────────────────────────────────── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-950/80 border border-indigo-800 text-indigo-400 flex items-center justify-center">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Worker Dashboard Advertisements</h2>
              <p className="text-xs text-gray-400">Upload banner image (JPG, PNG, WEBP max 5MB) and set destination URL.</p>
            </div>
          </div>
        </div>

        {/* Create Advertisement Form */}
        <form onSubmit={handleCreateAdvertisement} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Advertisement Label / Title
              </label>
              <input
                type="text"
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                placeholder="e.g. Paid, Sponsor, Special Offer"
                className="w-full rounded-2xl bg-gray-950/90 border border-gray-800 p-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Destination URL (HTTPS or Internal)
              </label>
              <input
                type="text"
                value={adUrl}
                onChange={(e) => setAdUrl(e.target.value)}
                placeholder="https://t.me/+TZB6c_pdeYVjNmE1 or /jobs"
                className="w-full rounded-2xl bg-gray-950/90 border border-gray-800 p-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Image Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Banner Image (Max 5MB • JPG, PNG, WEBP)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-gray-200 hover:file:bg-gray-700 cursor-pointer"
              />
              {adPreview && (
                <div className="relative h-20 w-36 rounded-xl overflow-hidden border border-gray-700 shrink-0">
                  <img src={adPreview} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={adActive}
                onChange={(e) => setAdActive(e.target.checked)}
                className="rounded border-gray-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Set as active immediately (shown on Worker Dashboard)</span>
            </label>

            <button
              type="submit"
              disabled={submittingAd}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {submittingAd ? 'Uploading...' : 'Save & Publish Advertisement'}
            </button>
          </div>
        </form>

        {/* Advertisement List */}
        <div className="pt-4 border-t border-gray-800/80">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Existing Advertisements ({advertisements.length})
          </h3>

          {loading ? (
            <div className="py-8 text-center text-xs text-gray-500">Loading advertisements...</div>
          ) : advertisements.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">No advertisements uploaded yet.</div>
          ) : (
            <div className="space-y-4">
              {advertisements.map((ad) => (
                <div
                  key={ad.id}
                  className="p-4 rounded-2xl bg-gray-950/60 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-gray-700"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={ad.imageUrl}
                      alt={ad.title || 'Advertisement'}
                      className="h-16 w-28 rounded-xl object-cover border border-gray-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {ad.title || 'Paid'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleAd(ad)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                            ad.isActive
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                              : 'bg-gray-900 text-gray-500 border border-gray-800 hover:text-gray-300'
                          }`}
                        >
                          {ad.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {ad.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>

                      <a
                        href={ad.destinationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1 truncate"
                      >
                        <span className="truncate max-w-xs">{ad.destinationUrl}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                      <span className="text-[10px] text-gray-500 block mt-0.5">
                        Uploaded {new Date(ad.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAd({ ...ad });
                        setEditAdFile(null);
                        setEditAdPreview(null);
                      }}
                      className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors cursor-pointer"
                      title="Edit Advertisement"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAd(ad.id)}
                      className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 hover:text-rose-300 border border-rose-800/40 transition-colors cursor-pointer"
                      title="Delete Advertisement"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          MODAL: EDIT ANNOUNCEMENT
      ───────────────────────────────────────────── */}
      {editingAnnouncement && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-purple-400" /> Edit Announcement
              </h3>
              <button
                onClick={() => setEditingAnnouncement(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Message</label>
                <textarea
                  rows={3}
                  value={editingAnnouncement.message}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, message: e.target.value })}
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingAnnouncement.isActive}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, isActive: e.target.checked })}
                  className="rounded border-gray-700 text-purple-600 focus:ring-purple-500"
                />
                <span>Active</span>
              </label>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingAnnouncement(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL: EDIT ADVERTISEMENT
      ───────────────────────────────────────────── */}
      {editingAd && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-indigo-400" /> Edit Advertisement
              </h3>
              <button
                onClick={() => setEditingAd(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAd} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Title / Label</label>
                <input
                  type="text"
                  value={editingAd.title || ''}
                  onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Destination URL</label>
                <input
                  type="text"
                  value={editingAd.destinationUrl}
                  onChange={(e) => setEditingAd({ ...editingAd, destinationUrl: e.target.value })}
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Current Banner Image</label>
                <div className="flex items-center gap-3">
                  <img
                    src={editAdPreview || editingAd.imageUrl}
                    alt="Ad Banner"
                    className="h-16 w-28 rounded-xl object-cover border border-gray-800"
                  />
                  <div className="flex-1">
                    <span className="text-[11px] text-gray-400 block mb-1">Replace Image (optional):</span>
                    <input
                      type="file"
                      ref={editFileInputRef}
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleEditFileChange}
                      className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gray-800 file:text-gray-200"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingAd.isActive}
                  onChange={(e) => setEditingAd({ ...editingAd, isActive: e.target.checked })}
                  className="rounded border-gray-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Active</span>
              </label>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingAd(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAd}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white disabled:opacity-50"
                >
                  {submittingAd ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
