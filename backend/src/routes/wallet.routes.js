const express = require('express');
const router = express.Router();
const {
  getWallet,
  getTransactions,
  getActivePaymentMethods,
  getWalletConfig,
  requestWithdrawal,
  getWithdrawals,
  requestDeposit,
  getDeposits,
} = require('../controllers/wallet.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Public/authenticated configuration & methods
router.get('/config', authenticate, getWalletConfig);
router.get('/payment-methods', authenticate, getActivePaymentMethods);

// Wallet & Ledger
router.get('/', authenticate, getWallet);
router.get('/transactions', authenticate, getTransactions);

// Withdrawals (Workers only)
router.post('/withdrawals', authenticate, requestWithdrawal);
router.get('/withdrawals', authenticate, getWithdrawals);

// Deposits (Employers only)
router.post('/deposits', authenticate, requestDeposit);
router.get('/deposits', authenticate, getDeposits);

module.exports = router;
