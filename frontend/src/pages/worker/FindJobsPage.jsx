import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Zap, ArrowRight, Globe, Layers, Pin, ShieldCheck } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import api from '../../services/api';

export const FindJobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const searchQuery = searchParams.get('search') || '';
  const categoryIdQuery = searchParams.get('categoryId') || '';
  const sortQuery = searchParams.get('sort') || 'newest';

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        if (res.data?.success) setCategories(res.data.data);
      })
      .catch(() => {});
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      const res = await api.get(`/jobs?${params.toString()}`);
      if (res.data?.success) {
        setJobs(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const val = e.target.search.value;
    const next = new URLSearchParams(searchParams);
    if (val) next.set('search', val);
    else next.delete('search');
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleCategorySelect = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('categoryId', id);
    else next.delete('categoryId');
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleSortChange = (sortVal) => {
    const next = new URLSearchParams(searchParams);
    next.set('sort', sortVal);
    setSearchParams(next);
  };

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Browse Microjobs
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Explore and complete high-paying microtasks with instant escrow verification.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center h-full text-gray-500 w-4" />
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="Search tasks by title, keywords..."
              className="w-full rounded-xl bg-gray-950/80 border border-gray-800 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={sortQuery}
            onChange={(e) => handleSortChange(e.target.value)}
            className="rounded-xl bg-gray-950/80 border border-gray-800 px-4 py-2.5 text-xs sm:text-sm text-gray-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="reward_high">Highest Reward</option>
            <option value="reward_low">Lowest Reward</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow transition-colors"
          >
            Search
          </button>
        </form>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => handleCategorySelect('')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              !categoryIdQuery
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                categoryIdQuery === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto mb-3" />
          Loading microjobs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <Layers className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No active jobs found</h3>
          <p className="text-xs text-gray-400 mt-1">Try broadening your search or choosing another category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => {
            const completed = job.completedWorkers || 0;
            const total = job.totalWorkers || 1;
            const percent = Math.min(100, Math.round((completed / total) * 100));

            return (
              <div
                key={job.id}
                className="glass-card rounded-3xl p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-all duration-300 relative group"
              >
                {job.visibility === 'PINNED' && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-md">
                    <Pin className="h-3 w-3" /> PINNED
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950/80 border border-indigo-800/80 text-indigo-300">
                      {job.category?.name || 'Task'}
                    </span>
                    {job.userAssignmentStatus && (
                      <Badge>{job.userAssignmentStatus}</Badge>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {job.title}
                  </h3>

                  <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                    {job.shortDescription || 'Complete instructions and submit required evidence.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-800/80 space-y-4">
                  {/* Slots Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>Slots reserved: {completed}/{total}</span>
                      <span className="font-semibold text-indigo-400">{percent}%</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Reward & Action */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase block font-semibold">Reward</span>
                      <span className="text-lg font-black text-emerald-400">
                        ${parseFloat(job.rewardPerWorker).toFixed(2)}
                      </span>
                    </div>

                    <Link
                      to={`/jobs/${job.id}`}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow transition-all hover:scale-105"
                    >
                      {job.userAssignmentStatus ? 'View Task' : 'Start Task'} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
