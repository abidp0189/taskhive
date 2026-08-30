const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { success, error } = require('../utils/response');

router.post('/proof', authenticate, upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return error(res, 'No files uploaded', 400);
  }

  const uploaded = req.files.map((file) => ({
    filename: file.filename,
    originalName: file.originalname,
    url: `/uploads/proofs/${file.filename}`,
    size: file.size,
    mimeType: file.mimetype,
  }));

  return success(res, uploaded, 'Files uploaded successfully');
});

module.exports = router;
