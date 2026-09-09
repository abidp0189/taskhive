import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, ArrowLeft, CheckCircle, AlertCircle, SendHorizonal } from 'lucide-react';
import api from '../../services/api';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      // Always show success — backend never reveals if email exists
      setSent(true);
    } catch {
      // Even on network/server error, show a neutral message to avoid enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[var(--color-background)] transition-colors duration-300">
      <div className="w-full max-w-md space-y-7">

        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-btn-primary)] text-[var(--color-btn-text)] shadow-md group-hover:scale-105 transition-transform">
              <Zap className="h-6 w-6" />
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold text-[var(--color-text)] tracking-tight uppercase">
            Forgot Your <span className="gradient-text font-black">Password?</span>
          </h1>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)] font-medium">
            Enter your account email and we'll send you a reset link.
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl p-7 sm:p-8 shadow-2xl border border-[var(--color-border)]">

          {sent ? (
            /* ── Success state ── */
            <div
              className="flex flex-col items-center gap-4 text-center py-4"
              style={{ animation: 'fadeInUp 0.4s ease both' }}
            >
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-bold text-white mb-1">Check your inbox</p>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-xs mx-auto">
                  If an account exists for <strong className="text-[var(--color-text)]">{email}</strong>, a password reset link has been sent. The link expires in <strong className="text-[var(--color-text)]">1 hour</strong>.
                </p>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-2">
                Didn't receive it? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="font-bold text-[var(--color-btn-primary)] hover:underline"
                >
                  try again
                </button>
                .
              </p>
              <Link
                to="/login"
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="pb-3 border-b border-[var(--color-border)]">
                <span className="text-xs font-extrabold text-[var(--color-text)] uppercase tracking-wider">
                  🔑 Password Recovery
                </span>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-bold text-[var(--color-text)] mb-2"
                >
                  Your Account Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--color-text-secondary)]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                    required
                    className="w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] pl-10 pr-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-text)] focus:outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full crystal-btn flex items-center justify-center gap-2 rounded-full py-3.5 text-xs font-extrabold uppercase tracking-widest bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-text)] shadow-lg disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    <SendHorizonal className="h-4 w-4" /> Send Reset Link
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
