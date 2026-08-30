const express = require('express');
const router = express.Router();
const {
  getJobs, getJob, startJob, createJob, updateJob, changeJobStatus,
} = require('../controllers/job.controller');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth.middleware');

// Public
router.get('/', optionalAuth, getJobs);
router.get('/:id', optionalAuth, getJob);

// Worker
router.post('/:id/start', authenticate, authorize('WORKER'), startJob);

// Employer
router.post('/', authenticate, authorize('EMPLOYER', 'ADMIN'), createJob);
router.patch('/:id', authenticate, authorize('EMPLOYER', 'ADMIN'), updateJob);
router.post('/:id/pause', authenticate, authorize('EMPLOYER', 'ADMIN'), changeJobStatus);
router.post('/:id/resume', authenticate, authorize('EMPLOYER', 'ADMIN'), changeJobStatus);
router.post('/:id/cancel', authenticate, authorize('EMPLOYER', 'ADMIN'), changeJobStatus);

module.exports = router;
