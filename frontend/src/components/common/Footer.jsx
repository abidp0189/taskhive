import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ShieldCheck, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-md pt-12 pb-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-btn-primary)] text-[var(--color-btn-text)] shadow-sm">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-[var(--color-text)]">
                Task<span className="gradient-text">Hive</span>
              </span>
            </Link>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              The modern microtask platform connecting skilled remote workers with global employers. Instant payouts, transparent verification, and safe escrow.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-500 font-bold">
              <ShieldCheck className="h-4 w-4" /> 100% Escrow Protected
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-4">For Workers</h4>
            <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
              <li><Link to="/jobs" className="hover:text-[var(--color-text)] transition-colors">Browse Available Tasks</Link></li>
              <li><Link to="/how-it-works" className="hover:text-[var(--color-text)] transition-colors">How Earning Works</Link></li>
              <li><Link to="/wallet" className="hover:text-[var(--color-text)] transition-colors">Instant Payout Methods</Link></li>
              <li><Link to="/referral" className="hover:text-[var(--color-text)] transition-colors">Referral 5% Commission</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-4">For Employers</h4>
            <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
              <li><Link to="/employer/jobs/new" className="hover:text-[var(--color-text)] transition-colors">Post a Microjob</Link></li>
              <li><Link to="/employer/dashboard" className="hover:text-[var(--color-text)] transition-colors">Employer Portal</Link></li>
              <li><Link to="/faq" className="hover:text-[var(--color-text)] transition-colors">Targeting & Geo Rules</Link></li>
              <li><Link to="/how-it-works" className="hover:text-[var(--color-text)] transition-colors">Proof Verification Engine</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-4">Help & Trust</h4>
            <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
              <li><Link to="/support" className="hover:text-[var(--color-text)] transition-colors">24/7 Support Desk</Link></li>
              <li><Link to="/faq" className="hover:text-[var(--color-text)] transition-colors">Frequently Asked Questions</Link></li>
              <li><span className="text-[var(--color-text-tertiary)] cursor-not-allowed">Terms of Service</span></li>
              <li><span className="text-[var(--color-text-tertiary)] cursor-not-allowed">Privacy Policy</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-tertiary)]">
          <p>© {new Date().getFullYear()} TaskHive. All rights reserved.</p>
          <p className="flex items-center gap-1 font-medium">
            Engineered with <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> for global micro-workers
          </p>
        </div>
      </div>
    </footer>
  );
};
