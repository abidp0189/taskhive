import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Zap, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawToken = searchParams.get('token') || '';
  const token = rawToken.trim();

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError('This reset link is missing a valid security token.');
      return;
    }

    const checkToken = async () => {
      setVerifying(true);
      try {
        const res = await api.get(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        setTokenValid(true);
        if (res.data?.data) {
          setUserInfo({
            name: res.data.data.name || '',
            email: res.data.data.email || '',
          });
        }
      } catch (err) {
        setTokenValid(false);
        const msg = err?.response?.data?.message || 'This reset link is invalid or has expired.';
        setTokenError(msg);
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!token) {
      setSubmitError('Invalid reset token. Please request a new reset link.');
      return;
    }
    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to reset password. Please request a new reset link.';
      setSubmitError(msg);
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
            Set New <span className="gradient-text font-black">Password</span>
          </h1>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)] font-medium">
            Choose a strong password for your Tomar Kaj account.
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl p-7 sm:p-8 shadow-2xl border border-[var(--color-border)]">

          {verifying ? (
            /* ── Verifying state ── */
            <div className="flex flex-col items-center gap-4 text-center py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-3 border-[var(--color-btn-primary)] border-t-transparent mx-auto" />
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Verifying your reset link…
              </p>
            </div>
          ) : !tokenValid ? (
            /* ── Invalid / Expired / Used token state ── */
            <div className="flex flex-col items-center gap-4 text-center py-4 space-y-2">
              <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-rose-400" />
              </div>
              <div>
                <p className="text-base font-bold text-[var(--color-text)] mb-1">Reset Link Unavailable</p>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-xs mx-auto">
                  {tokenError}
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2 w-full">
                <Link
                  to="/forgot-password"
                  className="w-full crystal-btn flex items-center justify-center gap-2 rounded-full py-3 text-xs font-extrabold uppercase tracking-widest bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-text)] shadow-lg transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Request a New Reset Link
                </Link>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] pt-1 transition-colors"
                >
                  ← Back to Sign In
                </Link>
              </div>
            </div>
          ) : success ? (
            /* ── Success state ── */
            <div
              className="flex flex-col items-center gap-4 text-center py-4"
              style={{ animation: 'fadeInUp 0.4s ease both' }}
            >
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-bold text-white mb-1">Password Reset Successful!</p>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Your password has been updated. Redirecting you to the sign in page…
                </p>
              </div>
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-btn-primary)] hover:underline"
              >
                Sign In now →
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="pb-3 border-b border-[var(--color-border)] flex items-center justify-between">
                <span className="text-xs font-extrabold text-[var(--color-text)] uppercase tracking-wider">
                  🔐 Create New Password
                </span>
                {userInfo.email && (
                  <span className="text-[11px] text-[var(--color-text-secondary)] font-medium truncate max-w-[180px]">
                    {userInfo.email}
                  </span>
                )}
              </div>

              {submitError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* New password */}
              <div>
                <label htmlFor="new-password" className="block text-xs font-bold text-[var(--color-text)] mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--color-text-secondary)]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setSubmitError(''); }}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    autoFocus
                    required
                    className="w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] pl-10 pr-11 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-text)] focus:outline-none transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <p className="mt-1.5 text-xs text-amber-500 font-medium">
                    {8 - password.length} more character{8 - password.length !== 1 ? 's' : ''} needed
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="confirm-password" className="block text-xs font-bold text-[var(--color-text)] mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--color-text-secondary)]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setSubmitError(''); }}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    required
                    className={`w-full rounded-xl bg-[var(--color-surface)] border pl-10 pr-11 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] focus:outline-none transition-all shadow-inner ${
                      confirm.length > 0
                        ? confirm === password
                          ? 'border-emerald-500/60 focus:border-emerald-400'
                          : 'border-rose-500/50 focus:border-rose-400'
                        : 'border-[var(--color-border)] focus:border-[var(--color-text)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] cursor-pointer"
                    title={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirm.length > 0 && confirm !== password && (
                  <p className="mt-1.5 text-xs text-rose-500 font-semibold">Passwords do not match</p>
                )}
                {confirm.length > 0 && confirm === password && (
                  <p className="mt-1.5 text-xs text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Passwords match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || password !== confirm || password.length < 8}
                className="w-full crystal-btn flex items-center justify-center gap-2 rounded-full py-3.5 text-xs font-extrabold uppercase tracking-widest bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-text)] shadow-lg disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    Set New Password <ArrowRight className="h-4 w-4" />
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
