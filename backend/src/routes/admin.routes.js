const express = require('express');
const router = express.Router();
const {
  getDashboard, getUsers, getUser, updateUserStatus, adjustBalance,
  getAdminJobs, updateJobStatus,
  getWithdrawals, processWithdrawal,
  getDeposits, confirmDeposit, rejectDeposit,
  getCategories, createCategory, updateCategory, createSubcategory, updateSubcategory,
  getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
  getSettings, updateSettings,
  getFraudFlags, getAuditLogs,
} = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const adminOnly = [authenticate, authorize('ADMIN')];
const adminOrMod = [authenticate, authorize('ADMIN', 'MODERATOR')];

router.get('/dashboard', ...adminOnly, getDashboard);

// Users
router.get('/users', ...adminOnly, getUsers);
router.get('/users/:id', ...adminOnly, getUser);
router.patch('/users/:id/status', ...adminOnly, updateUserStatus);
router.post('/users/:id/balance-adjustment', ...adminOnly, adjustBalance);

// Jobs
router.get('/jobs', ...adminOrMod, getAdminJobs);
router.patch('/jobs/:id/status', ...adminOrMod, updateJobStatus);

// Withdrawals
router.get('/withdrawals', ...adminOnly, getWithdrawals);
router.post('/withdrawals/:id/process', ...adminOnly, processWithdrawal);

// Deposits
router.get('/deposits', ...adminOnly, getDeposits);
router.post('/deposits/:id/confirm', ...adminOnly, confirmDeposit);
router.post('/deposits/:id/reject', ...adminOnly, rejectDeposit);

// Categories & Subcategories
router.get('/categories', ...adminOrMod, getCategories);
router.post('/categories', ...adminOnly, createCategory);
router.patch('/categories/:id', ...adminOnly, updateCategory);
router.post('/subcategories', ...adminOnly, createSubcategory);
router.patch('/subcategories/:id', ...adminOnly, updateSubcategory);

// Payment Methods
router.get('/payment-methods', ...adminOrMod, getPaymentMethods);
router.post('/payment-methods', ...adminOnly, createPaymentMethod);
router.patch('/payment-methods/:id', ...adminOnly, updatePaymentMethod);
router.delete('/payment-methods/:id', ...adminOnly, deletePaymentMethod);

// Settings
router.get('/settings', ...adminOnly, getSettings);
router.patch('/settings', ...adminOnly, updateSettings);

// Fraud & Audit
router.get('/fraud-flags', ...adminOrMod, getFraudFlags);
router.get('/audit-logs', ...adminOnly, getAuditLogs);

module.exports = router;
