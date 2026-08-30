const express = require('express');
const router = express.Router();
const { getReferralInfo, getReferralStats } = require('../controllers/referral.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, getReferralInfo);
router.get('/stats', authenticate, getReferralStats);

module.exports = router;
