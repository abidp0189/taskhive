import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Zap, Lock, Mail, User, ArrowRight, Gift } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['WORKER', 'EMPLOYER']),
  referralCode: z.string().optional(),
});

export const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('WORKER');

  const refFromUrl = searchParams.get('ref') || '';

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'WORKER',
      referralCode: refFromUrl,
    },
  });

  useEffect(() => {
    if (refFromUrl) {
      setValue('referralCode', refFromUrl);
    }
  }, [refFromUrl, setValue]);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await registerUser(data);
    setLoading(false);
    if (result.success) {
      if (result.user.role === 'EMPLOYER') {
        navigate('/employer/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[var(--color-background)] transition-colors duration-300">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-btn-primary)] text-[var(--color-btn-text)] shadow-md group-hover:scale-105 transition-transform">
              <Zap className="h-6 w-6" />
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold text-[var(--color-text)] tracking-tight font-heading uppercase">
            Create an Account
          </h2>
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
            Join the decentralized microjob ecosystem today.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
          <button
            type="button"
            onClick={() => handleRoleChange('WORKER')}
            className={`flex flex-col items-center py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedRole === 'WORKER'
                ? 'bg-[var(--color-btn-primary)] text-[var(--color-btn-text)] shadow-md'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
            }`}
          >
            <span>Worker</span>
            <span className="text-[10px] font-normal opacity-80 mt-0.5 lowercase">I want to complete tasks</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('EMPLOYER')}
            className={`flex flex-col items-center py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedRole === 'EMPLOYER'
                ? 'bg-[var(--color-btn-primary)] text-[var(--color-btn-text)] shadow-md'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
            }`}
          >
            <span>Employer</span>
            <span className="text-[10px] font-normal opacity-80 mt-0.5 lowercase">I want to hire workers</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="glass-panel rounded-3xl p-8 space-y-5 shadow-2xl border border-[var(--color-border)]">
          <input type="hidden" {...register('role')} />

          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-2">Full Name</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--color-text-secondary)]">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                {...register('name')}
                placeholder="Alex Morgan"
                className="w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] pl-10 pr-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-text)] focus:outline-none transition-all"
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-2">Email Address</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--color-text-secondary)]">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                {...register('email')}
                placeholder="alex@example.com"
                className="w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] pl-10 pr-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-text)] focus:outline-none transition-all"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-2">Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--color-text-secondary)]">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                {...register('password')}
                placeholder="Min 8 characters"
                className="w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] pl-10 pr-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-text)] focus:outline-none transition-all"
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-2">
              Referral Code <span className="text-[var(--color-text-tertiary)] font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--color-text-secondary)]">
                <Gift className="h-4 w-4 text-emerald-500" />
              </div>
              <input
                type="text"
                {...register('referralCode')}
                placeholder="e.g. WRKTEST"
                className="w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] pl-10 pr-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-text)] focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full crystal-btn flex items-center justify-center gap-2 rounded-full bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] py-3.5 text-xs font-extrabold uppercase tracking-widest text-[var(--color-btn-text)] shadow-lg disabled:opacity-50 transition-all mt-4 cursor-pointer"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                Create {selectedRole === 'WORKER' ? 'Worker' : 'Employer'} Account <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-[var(--color-text-secondary)]">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[var(--color-text)] hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
