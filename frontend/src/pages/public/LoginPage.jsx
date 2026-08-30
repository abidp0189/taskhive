import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Zap, Lock, Mail, ArrowRight, Shield, Briefcase, UserCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const initialRoleParam = searchParams.get('role')?.toUpperCase();
  const [activeRole, setActiveRole] = useState(
    initialRoleParam === 'ADMIN' ? 'ADMIN' : initialRoleParam === 'EMPLOYER' ? 'EMPLOYER' : 'WORKER'
  );

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const selectRole = (role) => {
    setActiveRole(role);
    setLoginError('');
  };

  const onSubmit = async (data) => {
    setLoginError('');
    setLoading(true);
    const result = await login(data.email.trim(), data.password);
    setLoading(false);
    if (result.success) {
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (result.user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (result.user.role === 'EMPLOYER') {
        navigate('/employer/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setLoginError(result.message || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[var(--color-background)] transition-colors duration-300">
      <div className="w-full max-w-md space-y-7">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-btn-primary)] text-[var(--color-btn-text)] shadow-md group-hover:scale-105 transition-transform">
              <Zap className="h-6 w-6" />
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold text-[var(--color-text)] tracking-tight font-heading uppercase">
            Sign In to Task<span className="gradient-text font-black">Hive</span>
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)] font-medium">
            Select your account type to access the platform.
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-xs font-bold shadow-sm">
          <button
            type="button"
            onClick={() => selectRole('WORKER')}
            className={`py-2.5 px-3 rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer ${
              activeRole === 'WORKER'
                ? 'bg-[var(--color-btn-primary)] text-[var(--color-btn-text)] shadow-md'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Worker</span>
          </button>
          <button
            type="button"
            onClick={() => selectRole('EMPLOYER')}
            className={`py-2.5 px-3 rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer ${
              activeRole === 'EMPLOYER'
                ? 'bg-[var(--color-btn-primary)] text-[var(--color-btn-text)] shadow-md'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Employer</span>
          </button>
          <button
            type="button"
            onClick={() => selectRole('ADMIN')}
            className={`py-2.5 px-3 rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer ${
              activeRole === 'ADMIN'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Admin</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="glass-panel rounded-3xl p-7 sm:p-8 space-y-5 shadow-2xl border border-[var(--color-border)]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
            <span className="text-xs font-extrabold text-[var(--color-text)] uppercase tracking-wider">
              {activeRole === 'ADMIN' ? '🛡️ Administrator Access' : activeRole === 'EMPLOYER' ? '💼 Employer Sign In' : '👷 Worker Sign In'}
            </span>
          </div>

          {loginError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-2">Email Address</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--color-text-secondary)]">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] pl-10 pr-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-text)] focus:outline-none transition-all shadow-inner"
              />
            </div>
            {errors.email && <p className="mt-1.5 text-xs text-rose-500 font-semibold">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-2">Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--color-text-secondary)]">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="••••••••"
                autoComplete="current-password"
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
            {errors.password && <p className="mt-1.5 text-xs text-rose-500 font-semibold">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full crystal-btn flex items-center justify-center gap-2 rounded-full py-3.5 text-xs font-extrabold uppercase tracking-widest text-[var(--color-btn-text)] shadow-lg disabled:opacity-50 transition-all cursor-pointer mt-2 ${
              activeRole === 'ADMIN'
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)]'
            }`}
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                Sign In as {activeRole === 'ADMIN' ? 'Admin' : activeRole === 'EMPLOYER' ? 'Employer' : 'Worker'} <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-[var(--color-text-secondary)] font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-[var(--color-text)] hover:underline">
                Create one now
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
