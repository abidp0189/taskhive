'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getActivePromotions,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAdvertisements,
  uploadAdvertisementImage,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
} = require('../controllers/promotion.controller');

// Memory storage for ad image upload (max 5MB, filtered by MIME)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.'), false);
    }
  },
});

const adminOnly = [authenticate, authorize('ADMIN')];

// ─────────────────────────────────────────────
// WORKER / PUBLIC PROMOTIONS
// ─────────────────────────────────────────────
router.get('/active', getActivePromotions);

// ─────────────────────────────────────────────
// ADMIN ANNOUNCEMENTS
// ─────────────────────────────────────────────
router.get('/admin/announcements', ...adminOnly, getAnnouncements);
router.post('/admin/announcements', ...adminOnly, createAnnouncement);
router.patch('/admin/announcements/:id', ...adminOnly, updateAnnouncement);
router.delete('/admin/announcements/:id', ...adminOnly, deleteAnnouncement);

// ─────────────────────────────────────────────
// ADMIN ADVERTISEMENTS
// ─────────────────────────────────────────────
router.get('/admin/advertisements', ...adminOnly, getAdvertisements);
router.post(
  '/admin/advertisements/upload-image',
  ...adminOnly,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'Image size exceeds 5MB limit.' });
        }
        return res.status(400).json({ success: false, message: err.message });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  uploadAdvertisementImage
);
router.post('/admin/advertisements', ...adminOnly, createAdvertisement);
router.patch('/admin/advertisements/:id', ...adminOnly, updateAdvertisement);
router.delete('/admin/advertisements/:id', ...adminOnly, deleteAdvertisement);

module.exports = router;
