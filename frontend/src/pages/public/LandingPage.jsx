import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Coins, 
  ArrowRight, 
  Clock, 
  Globe2, 
  Layers, 
  Sparkles 
} from 'lucide-react';
import api from '../../services/api';

export const LandingPage = () => {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('worker');

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        if (res.data?.success) setCategories(res.data.data.slice(0, 8));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] transition-colors duration-300">
      {/* ─── Hero Section ───────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-28">
        {/* Glow background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-[#7c3aed]/20 via-[#a78bfa]/15 to-transparent blur-[140px] -z-10 pointer-events-none rounded-full" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface2)] px-4 py-1.5 text-xs font-bold text-[var(--color-text)] backdrop-blur-md shadow-sm mb-8"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            Next-Gen Microtask Ecosystem with Instant Escrow
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--color-text)] leading-tight uppercase font-heading"
          >
            Complete Small Tasks. <br className="hidden sm:inline" />
            <span className="gradient-text font-black">Earn Real Money</span> Fast.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed font-medium"
          >
            Join over 50,000+ active micro-workers and global employers. Browse vetted tasks, submit proof, and get paid directly to your wallet with zero hassle.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto crystal-btn flex items-center justify-center gap-2 rounded-full bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] px-8 py-4 text-xs font-extrabold uppercase tracking-widest text-[var(--color-btn-text)] shadow-xl transition-all hover:scale-105"
            >
              Start Earning Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/jobs"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-[var(--color-surface2)] border border-[var(--color-border)] px-8 py-4 text-xs font-extrabold uppercase tracking-widest text-[var(--color-text)] hover:border-[var(--color-text)] transition-all shadow-sm"
            >
              Explore Available Jobs
            </Link>
          </motion.div>

          {/* Key Metric Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            <div className="glass-card rounded-2xl p-5 text-center">
              <p className="text-2xl sm:text-3xl font-black text-[var(--color-text)]">$150K+</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 font-semibold">Paid to Workers</p>
            </div>
            <div className="glass-card rounded-2xl p-5 text-center">
              <p className="text-2xl sm:text-3xl font-black text-[var(--color-accent)]">250K+</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 font-semibold">Completed Tasks</p>
            </div>
            <div className="glass-card rounded-2xl p-5 text-center">
              <p className="text-2xl sm:text-3xl font-black text-emerald-500">99.4%</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 font-semibold">Approval Accuracy</p>
            </div>
            <div className="glass-card rounded-2xl p-5 text-center">
              <p className="text-2xl sm:text-3xl font-black text-[var(--color-text)]">&lt; 24h</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 font-semibold">Average Payout Time</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works Interactive Switcher ────── */}
      <section className="py-20 bg-[var(--color-surface2)]/40 border-y border-[var(--color-border)] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-[var(--color-text)] tracking-tight font-heading">How TaskHive Operates</h2>
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Choose your journey below to see the frictionless lifecycle.</p>

            {/* Toggle */}
            <div className="mt-6 inline-flex p-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full gap-1">
              <button
                onClick={() => setActiveTab('worker')}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'worker' 
                    ? 'bg-[var(--color-btn-primary)] text-[var(--color-btn-text)] shadow-md' 
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
              >
                I Want to Earn (Worker)
              </button>
              <button
                onClick={() => setActiveTab('employer')}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'employer' 
                    ? 'bg-[var(--color-btn-primary)] text-[var(--color-btn-text)] shadow-md' 
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
              >
                I Want Results (Employer)
              </button>
            </div>
          </div>

          {activeTab === 'worker' ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-card rounded-2xl p-6 relative">
                <span className="text-4xl font-black text-[var(--color-border)] absolute top-4 right-4 opacity-50">01</span>
                <div className="h-10 w-10 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] mb-4">
                  <Globe2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text)] mb-2">Find Eligible Tasks</h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Browse hundreds of small jobs tailored to your country and skill set.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 relative">
                <span className="text-4xl font-black text-[var(--color-border)] absolute top-4 right-4 opacity-50">02</span>
                <div className="h-10 w-10 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] mb-4">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text)] mb-2">Reserve & Complete</h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Reserve a guaranteed worker slot and follow the step-by-step instructions.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 relative">
                <span className="text-4xl font-black text-[var(--color-border)] absolute top-4 right-4 opacity-50">03</span>
                <div className="h-10 w-10 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] mb-4">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text)] mb-2">Submit Proof</h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Upload screenshots, links, or text proofs directly through our upload form.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 relative">
                <span className="text-4xl font-black text-[var(--color-border)] absolute top-4 right-4 opacity-50">04</span>
                <div className="h-10 w-10 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] flex items-center justify-center text-emerald-500 mb-4">
                  <Coins className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text)] mb-2">Get Paid & Withdraw</h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Once approved, earnings are credited immediately with fast manual withdrawals.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-card rounded-2xl p-6 relative">
                <span className="text-4xl font-black text-[var(--color-border)] absolute top-4 right-4 opacity-50">01</span>
                <div className="h-10 w-10 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] mb-4">
                  <Coins className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text)] mb-2">Deposit Funds</h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Add funds to your employer deposit wallet via multiple payment methods.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 relative">
                <span className="text-4xl font-black text-[var(--color-border)] absolute top-4 right-4 opacity-50">02</span>
                <div className="h-10 w-10 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] mb-4">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text)] mb-2">Post Your Campaign</h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Use our 4-step wizard to target specific countries, set quantities, and specify rules.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 relative">
                <span className="text-4xl font-black text-[var(--color-border)] absolute top-4 right-4 opacity-50">03</span>
                <div className="h-10 w-10 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] mb-4">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text)] mb-2">Review Proofs</h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Review worker submissions with 1-click approvals or request resubmissions.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 relative">
                <span className="text-4xl font-black text-[var(--color-border)] absolute top-4 right-4 opacity-50">04</span>
                <div className="h-10 w-10 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] flex items-center justify-center text-emerald-500 mb-4">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text)] mb-2">Scale Campaign</h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Watch genuine engagement roll in while your escrow automatically settles payments.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Top Categories ─────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] tracking-tight font-heading">Popular Job Categories</h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">Explore available microtasks across diverse digital verticals.</p>
            </div>
            <Link to="/jobs" className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] hover:opacity-80 flex items-center gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/jobs?categoryId=${cat.id}`}
                className="glass-card rounded-2xl p-5 flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="h-10 w-10 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] mb-3 group-hover:scale-110 transition-all">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">{cat.name}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">{cat.description}</p>
                </div>
                <div className="mt-4 flex items-center text-[11px] text-[var(--color-text-tertiary)] font-bold group-hover:text-[var(--color-text)]">
                  <span>Browse tasks</span>
                  <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Call to Action ─────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] p-8 sm:p-12 text-center shadow-2xl backdrop-blur-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text)] tracking-tight font-heading">
              Ready to Monetize Your Spare Time?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-[var(--color-text-secondary)] font-medium">
              Create an account in less than 60 seconds and start completing verified jobs immediately.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto crystal-btn rounded-full bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] px-8 py-4 text-xs font-extrabold uppercase tracking-widest text-[var(--color-btn-text)] shadow-xl transition-all hover:scale-105"
              >
                Create Free Account
              </Link>
              <Link
                to="/how-it-works"
                className="w-full sm:w-auto rounded-full bg-[var(--color-surface2)] border border-[var(--color-border)] px-8 py-4 text-xs font-extrabold uppercase tracking-widest text-[var(--color-text)] hover:border-[var(--color-text)] transition-all"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
