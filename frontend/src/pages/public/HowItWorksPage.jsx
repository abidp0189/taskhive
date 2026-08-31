import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, DollarSign, Users, Award, Lock, Zap } from 'lucide-react';

export const HowItWorksPage = () => {
  return (
    <div className="py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          How Tomar Kaj Works
        </h1>
        <p className="mt-4 text-sm sm:text-base text-gray-400">
          A transparent, fraud-protected microtask marketplace connecting workers with reputable employers.
        </p>
      </div>

      {/* Grid of Steps */}
      <div className="space-y-16">
        {/* Worker Flow */}
        <div>
          <h2 className="text-xl font-bold text-indigo-400 mb-8 flex items-center gap-2">
            <Zap className="h-5 w-5" /> For Micro-Workers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card rounded-2xl p-6 border-indigo-900/40">
              <div className="h-10 w-10 rounded-xl bg-indigo-950/80 border border-indigo-800 text-indigo-400 flex items-center justify-center font-bold mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-white mb-2">Find a Task & Reserve Slot</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Browse active campaigns with transparent rewards. When you click "Start Job", a worker slot is atomically locked for you so no one can steal your reservation.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 border-indigo-900/40">
              <div className="h-10 w-10 rounded-xl bg-indigo-950/80 border border-indigo-800 text-indigo-400 flex items-center justify-center font-bold mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-white mb-2">Execute Instructions & Upload Proof</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Follow the employer's step-by-step instructions. Submit requested evidence (such as screenshot upload, profile link, or text answer) through our form.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 border-indigo-900/40">
              <div className="h-10 w-10 rounded-xl bg-indigo-950/80 border border-indigo-800 text-indigo-400 flex items-center justify-center font-bold mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-white mb-2">Escrow Release & Fast Payout</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Upon review approval, the pre-funded escrow immediately credits your available wallet balance. Request withdrawals anytime once minimum threshold is reached.
              </p>
            </div>
          </div>
        </div>

        {/* Employer Flow */}
        <div className="border-t border-gray-800 pt-16">
          <h2 className="text-xl font-bold text-purple-400 mb-8 flex items-center gap-2">
            <Users className="h-5 w-5" /> For Employers & Marketers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card rounded-2xl p-6 border-purple-900/40">
              <div className="h-10 w-10 rounded-xl bg-purple-950/80 border border-purple-800 text-purple-400 flex items-center justify-center font-bold mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-white mb-2">Fund Deposit Wallet</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Deposit campaign funds safely into your employer account. All budget amounts are locked in automated escrow and only deducted when you approve genuine work.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 border-purple-900/40">
              <div className="h-10 w-10 rounded-xl bg-purple-950/80 border border-purple-800 text-purple-400 flex items-center justify-center font-bold mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-white mb-2">Target Countries & Define Proofs</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Use our 4-step wizard to target global audiences or specific nations. Define required screenshots, character limits, and task guidelines.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 border-purple-900/40">
              <div className="h-10 w-10 rounded-xl bg-purple-950/80 border border-purple-800 text-purple-400 flex items-center justify-center font-bold mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-white mb-2">Review & Manage Submissions</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Review submitted screenshots and answers in a unified dashboard. Approve with 1 click, ask for resubmissions, or reject fraudulent attempts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Banner */}
      <div className="mt-16 glass-panel rounded-3xl p-8 border-emerald-900/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Escrow-Backed Integrity</h4>
            <p className="text-xs text-gray-400 mt-0.5">Workers are guaranteed payment upon approval, while employers only pay for valid work.</p>
          </div>
        </div>
        <Link
          to="/register"
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-xs font-bold text-white shadow hover:from-indigo-500 hover:to-purple-500 transition-all whitespace-nowrap"
        >
          Join Tomar Kaj Today
        </Link>
      </div>
    </div>
  );
};
