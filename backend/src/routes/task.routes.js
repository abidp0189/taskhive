const express = require('express');
const router = express.Router();
const {
  getMyTasks, getTask, submitTask,
  getSubmissions, approveSubmission, rejectSubmission, requestResubmit,
} = require('../controllers/task.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Worker tasks
router.get('/', authenticate, authorize('WORKER', 'ADMIN'), getMyTasks);
router.get('/:id', authenticate, getTask);
router.post('/:id/submit', authenticate, authorize('WORKER'), upload.array('files', 5), submitTask);

// Submission review
router.get('/employer/jobs/:id/submissions', authenticate, authorize('EMPLOYER', 'ADMIN', 'MODERATOR'), getSubmissions);
router.post('/submissions/:id/approve', authenticate, authorize('EMPLOYER', 'ADMIN', 'MODERATOR'), approveSubmission);
router.post('/submissions/:id/reject', authenticate, authorize('EMPLOYER', 'ADMIN', 'MODERATOR'), rejectSubmission);
router.post('/submissions/:id/resubmit-request', authenticate, authorize('EMPLOYER', 'ADMIN', 'MODERATOR'), requestResubmit);

module.exports = router;
