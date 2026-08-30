const express = require('express');
const router = express.Router();
const { getEmployerJobs } = require('../controllers/job.controller');
const { getSubmissions, approveSubmission, rejectSubmission, requestResubmit } = require('../controllers/task.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const employerAuth = [authenticate, authorize('EMPLOYER', 'ADMIN')];

router.get('/jobs', ...employerAuth, getEmployerJobs);
router.get('/jobs/:id/submissions', ...employerAuth, getSubmissions);
router.post('/submissions/:id/approve', ...employerAuth, approveSubmission);
router.post('/submissions/:id/reject', ...employerAuth, rejectSubmission);
router.post('/submissions/:id/resubmit-request', ...employerAuth, requestResubmit);

module.exports = router;
