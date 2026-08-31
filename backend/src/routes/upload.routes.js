const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const fs = require('fs');
const { success, error } = require('../utils/response');

router.post('/proof', authenticate, upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return error(res, 'No files uploaded', 400);
  }

  const uploaded = req.files.map((file) => {
    let url = `/uploads/proofs/${file.filename}`;
    try {
      if (file.mimetype.startsWith('image/') && fs.existsSync(file.path)) {
        const buf = fs.readFileSync(file.path);
        url = `data:${file.mimetype};base64,${buf.toString('base64')}`;
      }
    } catch (e) {
      console.error('Base64 upload encoding error', e);
    }
    return {
      filename: file.filename,
      originalName: file.originalname,
      url,
      size: file.size,
      mimeType: file.mimetype,
    };
  });

  return success(res, uploaded, 'Files uploaded successfully');
});

module.exports = router;
