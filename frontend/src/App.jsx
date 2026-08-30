import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { FaqPage } from './pages/public/FaqPage';

// Worker Pages
import { FindJobsPage } from './pages/worker/FindJobsPage';
import { JobDetailsPage } from './pages/worker/JobDetailsPage';
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import { MyTasksPage } from './pages/worker/MyTasksPage';
import { WalletPage } from './pages/worker/WalletPage';
import { WithdrawPage } from './pages/worker/WithdrawPage';
import { ReferralPage } from './pages/worker/ReferralPage';
import { ProfilePage } from './pages/worker/ProfilePage';
import { NotificationsPage } from './pages/worker/NotificationsPage';

// Employer Pages
import { EmployerDashboard } from './pages/employer/EmployerDashboard';
import { CreateJobWizard } from './pages/employer/CreateJobWizard';
import { MyJobsPage } from './pages/employer/MyJobsPage';
import { ReviewSubmissionsPage } from './pages/employer/ReviewSubmissionsPage';
import { EmployerWalletPage } from './pages/employer/EmployerWalletPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminJobsPage } from './pages/admin/AdminJobsPage';
import { AdminWithdrawalsPage } from './pages/admin/AdminWithdrawalsPage';
import { AdminDepositsPage } from './pages/admin/AdminDepositsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';

// Shared Pages
import { SupportTicketsPage } from './pages/support/SupportTicketsPage';

import { ThemeProvider } from './context/ThemeContext';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text)] relative transition-colors duration-300">
            <div className="aurora-overlay"></div>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  fontSize: '13px',
                },
              }}
            />

          <Navbar />

          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/jobs" element={<FindJobsPage />} />
              <Route path="/jobs/:id" element={<JobDetailsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/faq" element={<FaqPage />} />

              {/* Authenticated Shared */}
              <Route element={<ProtectedRoute allowedRoles={['WORKER', 'EMPLOYER', 'ADMIN', 'MODERATOR']} />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/support" element={<SupportTicketsPage />} />
              </Route>

              {/* Worker Routes */}
              <Route element={<ProtectedRoute allowedRoles={['WORKER', 'ADMIN']} />}>
                <Route path="/dashboard" element={<WorkerDashboard />} />
                <Route path="/my-tasks" element={<MyTasksPage />} />
                <Route path="/my-tasks/:id" element={<JobDetailsPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/withdraw" element={<WithdrawPage />} />
                <Route path="/referral" element={<ReferralPage />} />
              </Route>

              {/* Employer Routes */}
              <Route element={<ProtectedRoute allowedRoles={['EMPLOYER', 'ADMIN']} />}>
                <Route path="/employer/dashboard" element={<EmployerDashboard />} />
                <Route path="/employer/jobs" element={<MyJobsPage />} />
                <Route path="/employer/jobs/new" element={<CreateJobWizard />} />
                <Route path="/employer/jobs/:id/submissions" element={<ReviewSubmissionsPage />} />
                <Route path="/employer/wallet" element={<EmployerWalletPage />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MODERATOR']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/jobs" element={<AdminJobsPage />} />
                <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
                <Route path="/admin/deposits" element={<AdminDepositsPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
