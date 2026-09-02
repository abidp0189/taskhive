'use strict';

const express = require('express');
const router = express.Router();
const { randomUUID } = require('crypto');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { r2Client, R2_BUCKET, isR2Configured } = require('../config/r2');
const upload = require('../middleware/upload.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { success, error } = require('../utils/response');

// ---------------------------------------------------------------------------
// Allowed MIME types for proof uploads
// ---------------------------------------------------------------------------
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
]);

const MAX_FILE_SIZE_BYTES = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024;

function validateFile({ contentType, size }) {
  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    return `File type '${contentType}' is not allowed. Permitted: JPEG, PNG, GIF, WEBP, PDF, TXT.`;
  }
  if (size > MAX_FILE_SIZE_BYTES) {
    return `File exceeds the maximum allowed size of ${process.env.MAX_FILE_SIZE_MB || 10}MB.`;
  }
  return null;
}

function buildObjectKey({ userId, taskId, filename, contentType }) {
  // Build a path like: proofs/<taskId>/<userId>/<uuid>.<ext>
  const ext = contentType.split('/').pop().replace('jpeg', 'jpg');
  return `proofs/${taskId || 'general'}/${userId}/${randomUUID()}.${ext}`;
}

// ---------------------------------------------------------------------------
// POST /api/upload/presign
// Returns a presigned R2 PUT URL + the resulting object key.
// The client does a direct PUT to R2, then passes the objectKey when
// submitting task proof. No file bytes travel through this API server.
// ---------------------------------------------------------------------------
router.post('/presign', authenticate, async (req, res) => {
  if (!isR2Configured()) {
    return error(res, 'File storage (R2) is not configured on this server. Contact support.', 503);
  }

  const { filename, contentType, size, taskId } = req.body;

  if (!filename || !contentType || !size) {
    return error(res, 'filename, contentType, and size are required.', 400);
  }

  const validationError = validateFile({ contentType, size: Number(size) });
  if (validationError) {
    return error(res, validationError, 422);
  }

  try {
    const objectKey = buildObjectKey({
      userId: req.user.id,
      taskId,
      filename,
      contentType,
    });

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: objectKey,
      ContentType: contentType,
      ContentLength: Number(size),
    });

    // Presigned URL is valid for 15 minutes — enough time for the upload
    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });

    return success(res, {
      presignedUrl,
      objectKey,
      expiresIn: 900,
    }, 'Presigned upload URL generated');
  } catch (err) {
    console.error('[R2] Error generating presigned URL:', err);
    return error(res, 'Failed to generate upload URL. Please try again.', 500);
  }
});

// ---------------------------------------------------------------------------
// GET /api/upload/signed-url?key=<objectKey>
// Returns a short-lived signed GET URL so authenticated users can view proofs.
// Authorization is enforced at the task/submission level — callers must own
// or be allowed to review the submission.
// ---------------------------------------------------------------------------
router.get('/signed-url', authenticate, async (req, res) => {
  if (!isR2Configured()) {
    return error(res, 'File storage (R2) is not configured.', 503);
  }

  const { key } = req.query;
  if (!key) {
    return error(res, 'key query parameter is required.', 400);
  }

  // Basic path traversal guard
  if (key.includes('..') || key.startsWith('/')) {
    return error(res, 'Invalid object key.', 400);
  }

  try {
    const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
    // Signed GET URL valid for 5 minutes
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
    return success(res, { signedUrl, expiresIn: 300 }, 'Signed URL generated');
  } catch (err) {
    console.error('[R2] Error generating signed GET URL:', err);
    return error(res, 'Failed to generate file access URL.', 500);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/upload/object?key=<objectKey>
// Admin-only: removes an object from R2 (e.g., after 30-day proof cleanup).
// ---------------------------------------------------------------------------
router.delete('/object', authenticate, async (req, res) => {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
    return error(res, 'Forbidden.', 403);
  }

  if (!isR2Configured()) {
    return error(res, 'File storage (R2) is not configured.', 503);
  }

  const { key } = req.query;
  if (!key || key.includes('..') || key.startsWith('/')) {
    return error(res, 'Invalid or missing object key.', 400);
  }

  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return success(res, null, 'Object deleted successfully.');
  } catch (err) {
    console.error('[R2] Error deleting object:', err);
    return error(res, 'Failed to delete object.', 500);
  }
});

// ---------------------------------------------------------------------------
// POST /api/upload/proof  (legacy / dev-mode fallback)
// Only active when R2 is NOT configured (local dev without R2 credentials).
// In production, clients must use the /presign + direct R2 PUT flow.
// ---------------------------------------------------------------------------
const fs = require('fs');

router.post('/proof', authenticate, (req, res, next) => {
  if (isR2Configured()) {
    return error(
      res,
      'Direct file upload is disabled in production. Use POST /api/upload/presign instead.',
      405,
    );
  }
  next();
}, upload.array('files', 5), (req, res) => {
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
