import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, CheckCircle2, XCircle, DollarSign, ChevronRight, ChevronDown, Check, Save } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCat, setExpandedCat] = useState(null);

  // Modal State
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', slug: '', description: '', icon: 'Layers', sortOrder: 0 });

  const [showAddSub, setShowAddSub] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [newSub, setNewSub] = useState({ name: '', slug: '', defaultReward: '0.02', defaultCriteria: '', sortOrder: 0 });

  // Editing Subcategory inline
  const [editingSubId, setEditingSubId] = useState(null);
  const [editSubData, setEditSubData] = useState({ name: '', defaultReward: '', defaultCriteria: '' });

  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      if (res.data?.success) {
        setCategories(res.data.data);
        if (res.data.data.length > 0 && !expandedCat) {
          setExpandedCat(res.data.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const slug = newCat.slug || newCat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    try {
      const res = await api.post('/admin/categories', { ...newCat, slug });
      if (res.data?.success) {
        toast.success('Category created successfully');
        setShowAddCat(false);
        setNewCat({ name: '', slug: '', description: '', icon: 'Layers', sortOrder: 0 });
        fetchCategories();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleToggleCategory = async (cat) => {
    try {
      const res = await api.patch(`/admin/categories/${cat.id}`, { isActive: !cat.isActive });
      if (res.data?.success) {
        toast.success(`Category ${!cat.isActive ? 'activated' : 'deactivated'}`);
        fetchCategories();
      }
    } catch (err) {
      toast.error('Failed to update category');
    }
  };

  const handleCreateSubcategory = async (e) => {
    e.preventDefault();
    const slug = newSub.slug || newSub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    try {
      const res = await api.post('/admin/subcategories', {
        categoryId: selectedCatId,
        name: newSub.name,
        slug,
        defaultReward: parseFloat(newSub.defaultReward) || 0.02,
        defaultCriteria: newSub.defaultCriteria,
        sortOrder: parseInt(newSub.sortOrder) || 0,
      });
      if (res.data?.success) {
        toast.success('Subcategory created successfully');
        setShowAddSub(false);
        setNewSub({ name: '', slug: '', defaultReward: '0.02', defaultCriteria: '', sortOrder: 0 });
        fetchCategories();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create subcategory');
    }
  };

  const handleSaveSubcategory = async (subId) => {
    try {
      const res = await api.patch(`/admin/subcategories/${subId}`, {
        name: editSubData.name,
        defaultReward: parseFloat(editSubData.defaultReward) || 0.02,
        defaultCriteria: editSubData.defaultCriteria,
      });
      if (res.data?.success) {
        toast.success('Subcategory updated');
        setEditingSubId(null);
        fetchCategories();
      }
    } catch (err) {
      toast.error('Failed to update subcategory');
    }
  };

  const handleToggleSubcategory = async (sub) => {
    try {
      const res = await api.patch(`/admin/subcategories/${sub.id}`, { isActive: !sub.isActive });
      if (res.data?.success) {
        toast.success(`Subcategory ${!sub.isActive ? 'activated' : 'deactivated'}`);
        fetchCategories();
      }
    } catch (err) {
      toast.error('Failed to update subcategory');
    }
  };

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dynamic Job Categories & Default Rewards
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Configure dynamic database-driven categories, subcategories, default worker rewards, and task criteria.
          </p>
        </div>

        <button
          onClick={() => setShowAddCat(true)}
          className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-2.5 text-xs font-bold text-white shadow transition-all hover:scale-105"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-gray-500">Loading categories...</div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const isExpanded = expandedCat === cat.id;
            return (
              <div key={cat.id} className="glass-panel rounded-2xl overflow-hidden border border-gray-800 transition-all">
                {/* Category Header Bar */}
                <div
                  onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-850/50 select-none transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-gray-400 hover:text-white">
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-900 px-2 py-0.5 rounded-full border border-gray-800">
                          {cat.slug}
                        </span>
                        <span className="text-[10px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800">
                          {cat.subcategories?.length || 0} Subcategories
                        </span>
                      </div>
                      {cat.description && <p className="text-xs text-gray-400 mt-0.5">{cat.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleCategory(cat)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                        cat.isActive
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-gray-900 text-gray-500 border border-gray-800'
                      }`}
                    >
                      {cat.isActive ? 'Active' : 'Deactivated'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCatId(cat.id);
                        setShowAddSub(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 text-purple-300 hover:text-white text-[11px] font-semibold transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Subcategory
                    </button>
                  </div>
                </div>

                {/* Subcategories Table */}
                {isExpanded && (
                  <div className="border-t border-gray-800/80 bg-gray-950/60 p-4 sm:p-6 space-y-3">
                    {cat.subcategories?.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">No subcategories defined for this category.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-gray-400 uppercase font-semibold border-b border-gray-800/80">
                            <tr>
                              <th className="py-2.5 px-3">Subcategory Name</th>
                              <th className="py-2.5 px-3">Default Reward</th>
                              <th className="py-2.5 px-3">Default Instructions / Criteria</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/40">
                            {cat.subcategories.map((sub) => {
                              const isEditing = editingSubId === sub.id;
                              return (
                                <tr key={sub.id} className="hover:bg-gray-900/40 transition-colors">
                                  <td className="py-3 px-3 font-semibold text-white">
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={editSubData.name}
                                        onChange={(e) => setEditSubData({ ...editSubData, name: e.target.value })}
                                        className="rounded-lg bg-gray-900 border border-gray-700 px-2 py-1 text-white text-xs w-full"
                                      />
                                    ) : (
                                      sub.name
                                    )}
                                  </td>

                                  <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        step="0.001"
                                        value={editSubData.defaultReward}
                                        onChange={(e) => setEditSubData({ ...editSubData, defaultReward: e.target.value })}
                                        className="rounded-lg bg-gray-900 border border-gray-700 px-2 py-1 text-emerald-400 font-mono text-xs w-24"
                                      />
                                    ) : (
                                      `$${parseFloat(sub.defaultReward || 0.02).toFixed(3)}`
                                    )}
                                  </td>

                                  <td className="py-3 px-3 text-gray-400 max-w-xs">
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={editSubData.defaultCriteria}
                                        onChange={(e) => setEditSubData({ ...editSubData, defaultCriteria: e.target.value })}
                                        className="rounded-lg bg-gray-900 border border-gray-700 px-2 py-1 text-white text-xs w-full"
                                      />
                                    ) : (
                                      sub.defaultCriteria || 'None'
                                    )}
                                  </td>

                                  <td className="py-3 px-3">
                                    <button
                                      onClick={() => handleToggleSubcategory(sub)}
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                                        sub.isActive
                                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                          : 'bg-gray-900 text-gray-500 border border-gray-800'
                                      }`}
                                    >
                                      {sub.isActive ? 'Active' : 'Disabled'}
                                    </button>
                                  </td>

                                  <td className="py-3 px-3 text-right">
                                    {isEditing ? (
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={() => handleSaveSubcategory(sub.id)}
                                          className="p-1 text-emerald-400 hover:text-emerald-300"
                                          title="Save Changes"
                                        >
                                          <Check className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => setEditingSubId(null)}
                                          className="p-1 text-gray-400 hover:text-white"
                                          title="Cancel"
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setEditingSubId(sub.id);
                                          setEditSubData({
                                            name: sub.name,
                                            defaultReward: parseFloat(sub.defaultReward || 0.02).toFixed(3),
                                            defaultCriteria: sub.defaultCriteria || '',
                                          });
                                        }}
                                        className="p-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                                        title="Edit Reward & Criteria"
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCat && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add New Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                  placeholder="e.g. TikTok"
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Slug (Optional)</label>
                <input
                  type="text"
                  value={newCat.slug}
                  onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
                  placeholder="e.g. tiktok"
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Description</label>
                <input
                  type="text"
                  value={newCat.description}
                  onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                  placeholder="TikTok engagement tasks"
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddCat(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg transition-colors"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subcategory Modal */}
      {showAddSub && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add Subcategory</h3>
            <form onSubmit={handleCreateSubcategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Subcategory Name</label>
                <input
                  type="text"
                  value={newSub.name}
                  onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                  placeholder="e.g. Video Like + Share"
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Default Worker Reward ($ USD)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.01"
                  value={newSub.defaultReward}
                  onChange={(e) => setNewSub({ ...newSub, defaultReward: e.target.value })}
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white font-mono focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Default Task Criteria / Rules</label>
                <textarea
                  rows={3}
                  value={newSub.defaultCriteria}
                  onChange={(e) => setNewSub({ ...newSub, defaultCriteria: e.target.value })}
                  placeholder="e.g. Like the video and share to 1 social platform..."
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddSub(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg transition-colors"
                >
                  Create Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
