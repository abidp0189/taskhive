import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Globe, 
  Layers, 
  FileText, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle,
  Sparkles,
  Calendar,
  Clock,
  Camera,
  Info
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const CreateJobWizard = () => {
  const navigate = useNavigate();
  const { wallet, refreshWallet } = useAuth();

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [config, setConfig] = useState({
    platform_fee_percent: 10,
    screenshot_fee_percent: 3,
    min_job_budget: 0.80,
    default_estimated_days: 3,
    boost_1m_price: 0.04,
    boost_5m_price: 0.07,
    boost_10m_price: 0.15,
    boost_15m_price: 0.20,
  });
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Location
    targetType: 'GLOBAL', // 'GLOBAL' | 'REGION' | 'COUNTRY'
    selectedCountries: [],
    // Step 2: Category
    categoryId: '',
    subcategoryId: '',
    // Step 3: Job Information
    title: '',
    shortDescription: '',
    instructions: '',
    proofRequirements: '',
    targetUrl: '',
    proofTypes: 'TEXT,IMAGE',
    requiresScreenshot: true,
    // Step 4: Budget & Settings
    totalWorkers: 50,
    rewardPerWorker: 0.03,
    estimatedDays: 3,
    boostDuration: 0,
    publishMode: 'NOW', // 'NOW' | 'SCHEDULE'
    scheduledAt: '',
    taskExpiryHours: 48,
    maxResubmissions: 3,
    visibility: 'NORMAL',
  });

  useEffect(() => {
    refreshWallet();
    api.get('/categories')
      .then((res) => {
        if (res.data?.success) {
          setCategories(res.data.data);
          if (res.data.data.length > 0) {
            const firstCat = res.data.data[0];
            const firstSub = firstCat.subcategories?.[0];
            setFormData((prev) => ({
              ...prev,
              categoryId: firstCat.id,
              subcategoryId: firstSub ? firstSub.id : '',
              rewardPerWorker: firstSub ? parseFloat(firstSub.defaultReward) : 0.03,
            }));
          }
        }
      })
      .catch(console.error);

    api.get('/categories/countries')
      .then((res) => {
        if (res.data?.success) setCountries(res.data.data);
      })
      .catch(console.error);

    api.get('/wallet/config')
      .then((res) => {
        if (res.data?.success) setConfig(res.data.data);
      })
      .catch(console.error);
  }, []);

  const currentCategory = categories.find((c) => c.id === formData.categoryId);
  const currentSubcategory = currentCategory?.subcategories?.find((s) => s.id === formData.subcategoryId);

  const handleCategorySelect = (cat) => {
    const firstSub = cat.subcategories?.[0];
    setFormData((prev) => ({
      ...prev,
      categoryId: cat.id,
      subcategoryId: firstSub ? firstSub.id : '',
      rewardPerWorker: firstSub ? parseFloat(firstSub.defaultReward) : 0.03,
      instructions: firstSub?.defaultCriteria ? `Task Requirements:\n- ${firstSub.defaultCriteria}` : prev.instructions,
    }));
  };

  const handleSubcategorySelect = (subId) => {
    const sub = currentCategory?.subcategories?.find((s) => s.id === subId);
    setFormData((prev) => ({
      ...prev,
      subcategoryId: subId,
      rewardPerWorker: sub ? parseFloat(sub.defaultReward) : prev.rewardPerWorker,
      instructions: sub?.defaultCriteria ? `Task Requirements:\n- ${sub.defaultCriteria}` : prev.instructions,
    }));
  };

  // Authoritative Budget Calculations
  const reward = parseFloat(formData.rewardPerWorker) || 0;
  const workers = parseInt(formData.totalWorkers) || 0;
  const baseWorkerBudget = reward * workers;

  const platformFeeRate = (parseFloat(config.platform_fee_percent) || 10) / 100;
  const platformFee = baseWorkerBudget * platformFeeRate;

  const screenshotFeeRate = formData.requiresScreenshot ? (parseFloat(config.screenshot_fee_percent) || 3) / 100 : 0;
  const screenshotFee = baseWorkerBudget * screenshotFeeRate;

  const boostMap = {
    0: 0,
    1: parseFloat(config.boost_1m_price) || 0.04,
    5: parseFloat(config.boost_5m_price) || 0.07,
    10: parseFloat(config.boost_10m_price) || 0.15,
    15: parseFloat(config.boost_15m_price) || 0.20,
  };
  const boostCost = boostMap[parseInt(formData.boostDuration)] || 0;

  const totalCost = baseWorkerBudget + platformFee + screenshotFee + boostCost;
  const depositBalance = parseFloat(wallet?.depositBalance || 0);
  const minBudget = parseFloat(config.min_job_budget || 0.80);
  const meetsMinBudget = baseWorkerBudget >= minBudget;
  const hasEnoughFunds = depositBalance >= totalCost;

  const handleCountryToggle = (code) => {
    setFormData((prev) => {
      const exists = prev.selectedCountries.includes(code);
      return {
        ...prev,
        selectedCountries: exists
          ? prev.selectedCountries.filter((c) => c !== code)
          : [...prev.selectedCountries, code],
      };
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (formData.targetType === 'COUNTRY' && formData.selectedCountries.length === 0) {
        toast.error('Please select at least one country');
        return;
      }
    }
    if (step === 2) {
      if (!formData.categoryId) {
        toast.error('Please select a category');
        return;
      }
    }
    if (step === 3) {
      if (!formData.title.trim()) {
        toast.error('Job title is required');
        return;
      }
      if (!formData.instructions.trim()) {
        toast.error('Instructions are required');
        return;
      }
      if (!formData.proofRequirements.trim()) {
        toast.error('Proof requirements are required');
        return;
      }
    }
    setStep((prev) => Math.min(4, prev + 1));
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmitJob = async () => {
    if (!meetsMinBudget) {
      toast.error(`Minimum base job budget is $${minBudget.toFixed(2)}. Your base budget is $${baseWorkerBudget.toFixed(2)}.`);
      return;
    }

    if (!hasEnoughFunds) {
      toast.error(`Insufficient deposit balance. You need $${totalCost.toFixed(2)}.`);
      return;
    }

    if (formData.publishMode === 'SCHEDULE' && !formData.scheduledAt) {
      toast.error('Please select a scheduled publishing date and time');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        categoryId: formData.categoryId,
        subcategoryId: formData.subcategoryId || null,
        title: formData.title,
        shortDescription: formData.shortDescription || null,
        instructions: formData.instructions,
        proofRequirements: formData.proofRequirements,
        proofTypes: formData.proofTypes,
        requiresScreenshot: formData.requiresScreenshot,
        targetUrl: formData.targetUrl || null,
        rewardPerWorker: reward,
        totalWorkers: workers,
        estimatedDays: parseInt(formData.estimatedDays) || 3,
        boostDuration: parseInt(formData.boostDuration) || 0,
        scheduledAt: formData.publishMode === 'SCHEDULE' ? formData.scheduledAt : null,
        taskExpiryHours: formData.taskExpiryHours,
        maxResubmissions: formData.maxResubmissions,
        visibility: formData.visibility,
        targets: formData.targetType === 'GLOBAL'
          ? [{ targetType: 'GLOBAL' }]
          : formData.selectedCountries.map((c) => ({ targetType: 'COUNTRY', countryCode: c })),
      };

      const res = await api.post('/jobs', payload);
      if (res.data?.success) {
        toast.success(formData.publishMode === 'SCHEDULE' ? 'Job campaign scheduled successfully!' : 'Job campaign created and locked!');
        refreshWallet();
        navigate('/employer/jobs');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-8 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Post a Microjob Campaign
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Target worldwide workers, define proof requirements, configure boost priority, and escrow task rewards.
        </p>
      </div>

      {/* Steps Progress Header */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { num: 1, title: 'Location', icon: Globe },
          { num: 2, title: 'Category', icon: Layers },
          { num: 3, title: 'Job Rules', icon: FileText },
          { num: 4, title: 'Budget & Boost', icon: DollarSign },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <div
              key={s.num}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col sm:flex-row items-center justify-center gap-2 ${
                isActive
                  ? 'bg-purple-950/60 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                  : isDone
                  ? 'bg-gray-900 border-gray-700 text-purple-400'
                  : 'bg-gray-950/60 border-gray-800 text-gray-500'
              }`}
            >
              <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                isActive ? 'bg-purple-600 text-white' : isDone ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-gray-800 text-gray-400'
              }`}>
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.num}
              </div>
              <span className="text-xs font-semibold hidden sm:inline">{s.title}</span>
            </div>
          );
        })}
      </div>

      {/* Step Content Container */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        {/* ─── STEP 1: Location ─────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-gray-800">
              <Globe className="h-5 w-5 text-purple-400" /> Step 1 — Select Target Audience Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, targetType: 'GLOBAL', selectedCountries: [] })}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  formData.targetType === 'GLOBAL'
                    ? 'border-purple-500 bg-purple-950/30 text-white shadow-md'
                    : 'border-gray-800 bg-gray-950/60 text-gray-400 hover:border-gray-700 hover:text-white'
                }`}
              >
                <span className="text-2xl mb-2 block">🌍</span>
                <h4 className="text-sm font-bold text-white">Global (Worldwide Workers)</h4>
                <p className="text-xs text-gray-400 mt-1">Allow micro-workers from all supported nations to complete your task.</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, targetType: 'COUNTRY' })}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  formData.targetType === 'COUNTRY'
                    ? 'border-purple-500 bg-purple-950/30 text-white shadow-md'
                    : 'border-gray-800 bg-gray-950/60 text-gray-400 hover:border-gray-700 hover:text-white'
                }`}
              >
                <span className="text-2xl mb-2 block">🎯</span>
                <h4 className="text-sm font-bold text-white">Specific Countries</h4>
                <p className="text-xs text-gray-400 mt-1">Restrict task eligibility exclusively to workers in selected nations.</p>
              </button>
            </div>

            {formData.targetType === 'COUNTRY' && (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-gray-300">
                  Select Target Countries ({formData.selectedCountries.length} selected)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-3 bg-gray-950 rounded-2xl border border-gray-800">
                  {countries.map((c) => {
                    const isSelected = formData.selectedCountries.includes(c.code);
                    return (
                      <button
                        type="button"
                        key={c.code}
                        onClick={() => handleCountryToggle(c.code)}
                        className={`p-2 rounded-xl text-xs font-medium text-left truncate transition-colors ${
                          isSelected
                            ? 'bg-purple-600 text-white font-semibold'
                            : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                      >
                        {c.name} ({c.code})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 2: Category & Subcategory ────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-gray-800">
              <Layers className="h-5 w-5 text-purple-400" /> Step 2 — Choose Dynamic Category & Task Type
            </h3>

            {/* Category Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    formData.categoryId === cat.id
                      ? 'border-purple-500 bg-purple-950/40 text-white shadow-md'
                      : 'border-gray-800 bg-gray-950/60 text-gray-400 hover:border-gray-700 hover:text-white'
                  }`}
                >
                  <h4 className="text-xs font-bold text-white">{cat.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{cat.description || `${cat.subcategories?.length || 0} task options`}</p>
                </button>
              ))}
            </div>

            {/* Subcategories */}
            {currentCategory?.subcategories && currentCategory.subcategories.length > 0 && (
              <div className="pt-2 space-y-3">
                <label className="block text-xs font-semibold text-gray-300">
                  Select Specific Task Subcategory (Auto-fills recommended reward)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-3 bg-gray-950 rounded-2xl border border-gray-800">
                  {currentCategory.subcategories.map((sub) => {
                    const isSelected = formData.subcategoryId === sub.id;
                    return (
                      <button
                        type="button"
                        key={sub.id}
                        onClick={() => handleSubcategorySelect(sub.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-purple-500 bg-purple-900/30 text-white'
                            : 'border-gray-800/80 bg-gray-900 text-gray-300 hover:border-gray-700'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold">{sub.name}</p>
                          {sub.defaultCriteria && (
                            <p className="text-[10px] text-gray-400 line-clamp-1">{sub.defaultCriteria}</p>
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400 shrink-0 ml-2">
                          ${parseFloat(sub.defaultReward || 0.02).toFixed(3)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 3: Job Information & Rules ──────── */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-gray-800">
              <FileText className="h-5 w-5 text-purple-400" /> Step 3 — Job Information & Proof Requirements
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Job Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Watch YouTube Video (1-5 min) + Like + Positive Comment"
                className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Target Link / URL (Optional)</label>
              <input
                type="url"
                value={formData.targetUrl}
                onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Full Task Instructions for Worker</label>
              <textarea
                rows={4}
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="1. Go to the target link&#10;2. Watch the video completely&#10;3. Leave a relevant positive comment..."
                className="w-full rounded-xl bg-gray-950 border border-gray-800 p-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Proof Verification Requirements</label>
              <textarea
                rows={3}
                value={formData.proofRequirements}
                onChange={(e) => setFormData({ ...formData, proofRequirements: e.target.value })}
                placeholder="Provide a clear screenshot showing your comment posted and your username visible..."
                className="w-full rounded-xl bg-gray-950 border border-gray-800 p-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            {/* Screenshot Proof Toggle */}
            <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-purple-950/60 border border-purple-800 text-purple-400 flex items-center justify-center">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Require Screenshot Proof Image</h4>
                  <p className="text-[11px] text-gray-400">Adds 3% proof verification fee to campaign escrow</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.requiresScreenshot}
                onChange={(e) => setFormData({ ...formData, requiresScreenshot: e.target.checked })}
                className="h-5 w-5 rounded accent-purple-600 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ─── STEP 4: Budget, Boost & Scheduling ───── */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-gray-800">
              <DollarSign className="h-5 w-5 text-emerald-400" /> Step 4 — Budget, Boost & Publishing Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Total Worker Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalWorkers}
                  onChange={(e) => setFormData({ ...formData, totalWorkers: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs sm:text-sm text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Reward per Worker ($ USD)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.01"
                  value={formData.rewardPerWorker}
                  onChange={(e) => setFormData({ ...formData, rewardPerWorker: Math.max(0.001, parseFloat(e.target.value) || 0.01) })}
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs sm:text-sm text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Estimated Completion Days</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.estimatedDays}
                  onChange={(e) => setFormData({ ...formData, estimatedDays: Math.max(1, parseInt(e.target.value) || 3) })}
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs sm:text-sm text-white focus:border-purple-500 focus:outline-none"
                />
                <span className="text-[10px] text-gray-500">Default: 3 days</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Publishing Schedule</label>
                <select
                  value={formData.publishMode}
                  onChange={(e) => setFormData({ ...formData, publishMode: e.target.value })}
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs sm:text-sm text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="NOW">Publish Immediately</option>
                  <option value="SCHEDULE">Schedule for Future Date/Time</option>
                </select>
              </div>
            </div>

            {formData.publishMode === 'SCHEDULE' && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Scheduled Launch Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs sm:text-sm text-white focus:border-purple-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-gray-500">Task will not become visible to workers before this time.</span>
              </div>
            )}

            {/* Marketplace Boost Options */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-gray-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" /> Marketplace Priority Boost (Optional)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {[
                  { dur: 0, label: 'No Boost', price: 0 },
                  { dur: 1, label: '1 Minute', price: config.boost_1m_price },
                  { dur: 5, label: '5 Minutes', price: config.boost_5m_price },
                  { dur: 10, label: '10 Minutes', price: config.boost_10m_price },
                  { dur: 15, label: '15 Minutes', price: config.boost_15m_price },
                ].map((b) => (
                  <button
                    type="button"
                    key={b.dur}
                    onClick={() => setFormData({ ...formData, boostDuration: b.dur })}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      formData.boostDuration === b.dur
                        ? 'border-purple-500 bg-purple-950/40 text-white shadow-md'
                        : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <p className="font-bold text-white">{b.label}</p>
                    <p className="text-[10px] text-emerald-400 mt-0.5">
                      {b.price > 0 ? `+$${parseFloat(b.price).toFixed(2)}` : 'Free'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Authoritative Financial Breakdown Card */}
            <div className="p-5 rounded-2xl bg-gray-950 border border-gray-800 space-y-3 text-xs">
              <h4 className="font-bold text-white text-sm">Authoritative Cost Breakdown</h4>

              <div className="flex justify-between text-gray-400">
                <span>Base Worker Budget ({workers} workers × ${reward.toFixed(3)})</span>
                <span className="font-semibold text-white">${baseWorkerBudget.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-gray-400">
                <span>Platform Campaign Fee (10%)</span>
                <span className="font-semibold text-white">${platformFee.toFixed(2)}</span>
              </div>

              {formData.requiresScreenshot && (
                <div className="flex justify-between text-gray-400">
                  <span>Screenshot Proof Processing Fee (3%)</span>
                  <span className="font-semibold text-white">${screenshotFee.toFixed(2)}</span>
                </div>
              )}

              {boostCost > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Marketplace Priority Boost ({formData.boostDuration} min)</span>
                  <span className="font-semibold text-purple-400">+${boostCost.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-white font-bold pt-2 border-t border-gray-800 text-sm">
                <span>Total Employer Charge (Locked in Escrow)</span>
                <span className="text-emerald-400 font-black">${totalCost.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-gray-400 pt-1 text-[11px]">
                <span>Your Available Deposit Balance:</span>
                <span className={hasEnoughFunds ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  ${depositBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Validation Alerts */}
            {!meetsMinBudget && (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-900/50 text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Minimum Base Budget Not Met</p>
                  <p className="mt-0.5">
                    Minimum base job budget is ${minBudget.toFixed(2)}. Your current base budget is ${baseWorkerBudget.toFixed(2)}. Please increase worker quantity or reward.
                  </p>
                </div>
              </div>
            )}

            {!hasEnoughFunds && (
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Insufficient Deposit Balance</p>
                  <p className="mt-0.5">
                    Please deposit funds into your employer wallet before launching this campaign. Required: ${totalCost.toFixed(2)}, Available: ${depositBalance.toFixed(2)}.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wizard Controls Navigation */}
        <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 text-xs font-semibold text-gray-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow transition-all hover:scale-105"
            >
              Next Step <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || !hasEnoughFunds || !meetsMinBudget}
              onClick={handleSubmitJob}
              className="flex items-center gap-1.5 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all hover:scale-105"
            >
              {submitting ? 'Creating Campaign...' : 'Lock Budget & Post Job'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
