import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationDropdown } from './NotificationDropdown';
import { Badge } from './Badge';
import { 
  Zap, 
  Wallet as WalletIcon, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Briefcase, 
  PlusCircle, 
  CheckSquare, 
  Users, 
  Shield, 
  LifeBuoy,
  Sun,
  Moon
} from 'lucide-react';

export const Navbar = () => {
  const { user, wallet, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#a78bfa] shadow-md shadow-[#7c3aed]/30 text-white group-hover:scale-105 transition-transform">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-[var(--color-text)]">
                Task<span className="gradient-text font-black">Hive</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {!user ? (
                <>
                  <Link
                    to="/jobs"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/jobs') 
                        ? 'text-[var(--color-btn-text)] bg-[var(--color-btn-primary)] shadow-sm' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    Browse Jobs
                  </Link>
                  <Link
                    to="/how-it-works"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/how-it-works') 
                        ? 'text-[var(--color-btn-text)] bg-[var(--color-btn-primary)] shadow-sm' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    How it Works
                  </Link>
                  <Link
                    to="/faq"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/faq') 
                        ? 'text-[var(--color-btn-text)] bg-[var(--color-btn-primary)] shadow-sm' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    FAQ
                  </Link>
                </>
              ) : user.role === 'WORKER' ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/dashboard') 
                        ? 'text-[var(--color-btn-text)] bg-[var(--color-btn-primary)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/jobs"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/jobs') 
                        ? 'text-[var(--color-btn-text)] bg-[var(--color-btn-primary)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    Find Jobs
                  </Link>
                  <Link
                    to="/my-tasks"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/my-tasks') 
                        ? 'text-[var(--color-btn-text)] bg-[var(--color-btn-primary)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    My Work
                  </Link>
                  <Link
                    to="/wallet"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/wallet') 
                        ? 'text-[var(--color-btn-text)] bg-[var(--color-btn-primary)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    Wallet
                  </Link>
                  <Link
                    to="/referral"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/referral') 
                        ? 'text-[var(--color-btn-text)] bg-[var(--color-btn-primary)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    Referrals
                  </Link>
                </>
              ) : user.role === 'EMPLOYER' ? (
                <>
                  <Link
                    to="/employer/dashboard"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/employer/dashboard') 
                        ? 'text-[var(--color-btn-text)] bg-[var(--color-btn-primary)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/employer/jobs"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/employer/jobs') 
                        ? 'text-[var(--color-btn-text)] bg-[var(--color-btn-primary)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    My Jobs
                  </Link>
                  <Link
                    to="/employer/jobs/new"
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold rounded-xl crystal-btn bg-[var(--color-btn-primary)] text-[var(--color-btn-text)] hover:opacity-90 transition-all shadow-md`}
                  >
                    <PlusCircle className="h-4 w-4" /> Post Job
                  </Link>
                  <Link
                    to="/employer/wallet"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/employer/wallet') 
                        ? 'text-[var(--color-btn-text)] bg-[var(--color-btn-primary)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    Deposit & Balance
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/admin"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/admin') 
                        ? 'text-white bg-rose-600 shadow-sm' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/categories"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/admin/categories') 
                        ? 'text-white bg-rose-600 shadow-sm' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    Categories
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/admin/users') 
                        ? 'text-white bg-rose-600 shadow-sm' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    Users
                  </Link>
                  <Link
                    to="/admin/jobs"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/admin/jobs') 
                        ? 'text-white bg-rose-600 shadow-sm' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    Jobs
                  </Link>
                  <Link
                    to="/admin/withdrawals"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/admin/withdrawals') 
                        ? 'text-white bg-rose-600 shadow-sm' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    Withdrawals
                  </Link>
                  <Link
                    to="/admin/deposits"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/admin/deposits') 
                        ? 'text-white bg-rose-600 shadow-sm' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    Deposits
                  </Link>
                  <Link
                    to="/admin/settings"
                    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                      isActive('/admin/settings') 
                        ? 'text-white bg-rose-600 shadow-sm' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                    }`}
                  >
                    Settings
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Action Icons & User Profile */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Button (Live portfolio style) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Bright/Dark Theme"
              className="h-9 w-9 rounded-full flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface2)] text-[var(--color-text)] hover:scale-110 hover:border-[var(--color-text)] transition-all shadow-sm cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Bright / Light' : 'Dark'} Theme`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-300" />
              ) : (
                <Moon className="h-4 w-4 text-[var(--color-text)]" />
              )}
            </button>

            {user ? (
              <>
                {/* Wallet Balance Pill */}
                <Link
                  to={user.role === 'EMPLOYER' ? '/employer/wallet' : '/wallet'}
                  className="flex items-center gap-2 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold text-[var(--color-text)] hover:border-[var(--color-text)] transition-all shadow-sm"
                >
                  <WalletIcon className="h-3.5 w-3.5 text-emerald-500" />
                  <span>
                    {user.role === 'EMPLOYER'
                      ? `Deposit: $${(parseFloat(wallet?.depositBalance || 0)).toFixed(2)}`
                      : `Earned: $${(parseFloat(wallet?.availableBalance || 0)).toFixed(2)}`}
                  </span>
                </Link>

                {/* Notifications Dropdown */}
                <NotificationDropdown />

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] p-1.5 pr-3 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-text)] transition-colors focus:outline-none cursor-pointer"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-btn-primary)] text-[var(--color-btn-text)] font-bold uppercase text-xs">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <span className="max-w-[100px] truncate">{user.name}</span>
                    <Badge variant="primary" className="text-[9px] py-0 px-1.5">{user.role}</Badge>
                  </button>

                  {userDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl py-2 z-50 divide-y divide-[var(--color-border)]"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2">
                        <p className="text-xs font-bold text-[var(--color-text)] truncate">{user.name}</p>
                        <p className="text-[11px] text-[var(--color-text-secondary)] truncate">{user.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface2)] hover:text-[var(--color-text)]"
                        >
                          <User className="h-4 w-4" /> Profile Settings
                        </Link>
                        <Link
                          to="/support"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface2)] hover:text-[var(--color-text)]"
                        >
                          <LifeBuoy className="h-4 w-4" /> Support Desk
                        </Link>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-2 text-xs text-rose-500 hover:bg-rose-500/10 font-bold transition-colors"
                        >
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login?role=admin"
                  className="px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors border border-rose-400/40"
                >
                  Admin Login
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="crystal-btn px-4 py-2 text-sm font-bold text-[var(--color-btn-text)] bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] rounded-xl transition-all shadow-md"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {/* Theme Toggle Mobile */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Bright/Dark Theme"
              className="h-8 w-8 rounded-full flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface2)] text-[var(--color-text)]"
            >
              {theme === 'dark' ? (
                <Sun className="h-3.5 w-3.5 text-amber-300" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-[var(--color-text)]" />
              )}
            </button>

            {user && <NotificationDropdown />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface2)] hover:text-[var(--color-text)]"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 pt-2 pb-6 space-y-2">
          {user ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-[var(--color-surface2)] rounded-xl mb-3 border border-[var(--color-border)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-btn-primary)] text-[var(--color-btn-text)] font-bold">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text)]">{user.name}</p>
                  <Badge variant="primary">{user.role}</Badge>
                </div>
              </div>

              {user.role === 'WORKER' && (
                <>
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">Dashboard</Link>
                  <Link to="/jobs" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">Find Jobs</Link>
                  <Link to="/my-tasks" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">My Work</Link>
                  <Link to="/wallet" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">Wallet & Earnings</Link>
                  <Link to="/referral" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">Referral Program</Link>
                </>
              )}

              {user.role === 'EMPLOYER' && (
                <>
                  <Link to="/employer/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">Employer Dashboard</Link>
                  <Link to="/employer/jobs" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">My Posted Jobs</Link>
                  <Link to="/employer/jobs/new" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-bold text-[var(--color-accent)] hover:bg-[var(--color-surface2)] rounded-lg">Post New Job</Link>
                  <Link to="/employer/wallet" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">Deposit & Budget</Link>
                </>
              )}

              {user.role === 'ADMIN' && (
                <>
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">Admin Overview</Link>
                  <Link to="/admin/categories" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">Categories & Subcategories</Link>
                  <Link to="/admin/users" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">User Management</Link>
                  <Link to="/admin/jobs" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">Job Moderation</Link>
                  <Link to="/admin/withdrawals" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">Withdrawal Queue</Link>
                  <Link to="/admin/deposits" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">Deposit Requests</Link>
                  <Link to="/admin/settings" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">System Settings</Link>
                </>
              )}

              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">Profile & Security</Link>
              <Link to="/support" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">Support Tickets</Link>
              
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="w-full text-left px-3 py-2 text-sm text-rose-500 font-bold hover:bg-rose-500/10 rounded-lg mt-2"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/jobs" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">Browse Jobs</Link>
              <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">How It Works</Link>
              <Link to="/faq" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] rounded-lg">FAQ</Link>
              <div className="pt-2 flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-center py-2 text-sm font-semibold text-[var(--color-text)] bg-[var(--color-surface2)] rounded-xl border border-[var(--color-border)]">Sign In</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block text-center py-2 text-sm font-bold text-[var(--color-btn-text)] bg-[var(--color-btn-primary)] rounded-xl">Create Account</Link>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};
