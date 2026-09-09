'use strict';

const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const prisma = require('../utils/prisma');
const { success, badRequest, notFound, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/error.middleware');
const { r2Client, R2_BUCKET, R2_PUBLIC_BASE_URL, isR2Configured } = require('../config/r2');
const { broadcast } = require('../utils/realtime');

const UPLOAD_ADS_DIR = path.join(__dirname, '../../uploads/ads');
if (!fs.existsSync(UPLOAD_ADS_DIR)) {
  fs.mkdirSync(UPLOAD_ADS_DIR, { recursive: true });
}

// ─────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────

/**
 * Validates destination URLs according to security guidelines.
 * Allows:
 * - HTTPS (and standard HTTP) URLs
 * - Valid internal Tomar Kaj relative URLs (e.g. /jobs, /support)
 * Rejects:
 * - javascript:, data:, vbscript:, file:, ftp:, protocol-relative //
 */
function validateDestinationUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Destination URL is required.' };
  }

  const trimmed = rawUrl.trim();

  // Reject dangerous protocols and control characters
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('ftp:') ||
    trimmed.startsWith('//')
  ) {
    return { valid: false, error: 'Dangerous or prohibited URL protocol.' };
  }

  // Allow relative internal paths
  if (trimmed.startsWith('/')) {
    return { valid: true, url: trimmed };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, error: 'Only HTTPS and valid web URLs are permitted.' };
    }
    return { valid: true, url: parsed.toString() };
  } catch (_) {
    return { valid: false, error: 'Invalid URL format. Please provide a valid HTTPS URL or internal path.' };
  }
}

/**
 * Safely delete an image file either from Cloudflare R2 or local disk.
 */
async function cleanupImageFile(imageKey, imageUrl) {
  if (!imageKey && !imageUrl) return;

  try {
    // 1. Try R2 cleanup if imageKey is an R2 key or URL points to R2
    if (imageKey && !imageKey.startsWith('local:') && isR2Configured()) {
      await r2Client.send(new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: imageKey,
      }));
      return;
    }

    // 2. Try Local cleanup
    let localFilename = null;
    if (imageKey && imageKey.startsWith('local:')) {
      localFilename = imageKey.replace('local:', '');
    } else if (imageUrl && imageUrl.includes('/uploads/ads/')) {
      localFilename = imageUrl.split('/uploads/ads/').pop();
    }

    if (localFilename) {
      // Path traversal guard
      const safeFilename = path.basename(localFilename);
      const filePath = path.join(UPLOAD_ADS_DIR, safeFilename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (err) {
    console.error('[Promotion Controller] Error cleaning up image file:', err);
  }
}

// ─────────────────────────────────────────────
// WORKER / PUBLIC PROMOTIONS
// ─────────────────────────────────────────────

/**
 * GET /api/promotions/active
 * Returns the currently active announcement and advertisement.
 */
const getActivePromotions = asyncHandler(async (req, res) => {
  const [announcement, advertisement] = await Promise.all([
    prisma.announcement.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, message: true, isActive: true, updatedAt: true },
    }),
    prisma.advertisement.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, imageUrl: true, destinationUrl: true, isActive: true, updatedAt: true },
    }),
  ]);

  return success(res, {
    announcement: announcement || null,
    advertisement: advertisement || null,
  });
});

// ─────────────────────────────────────────────
// ADMIN ANNOUNCEMENT MANAGEMENT
// ─────────────────────────────────────────────

/**
 * GET /api/admin/announcements
 */
const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return success(res, announcements);
});

/**
 * POST /api/admin/announcements
 */
const createAnnouncement = asyncHandler(async (req, res) => {
  const { message, isActive = true } = req.body;

  if (!message || !message.trim()) {
    return badRequest(res, 'Announcement message is required.');
  }

  const isAct = Boolean(isActive);

  // If activating this one, optionally deactivate others to maintain a single prominent active announcement
  if (isAct) {
    await prisma.announcement.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  }

  const announcement = await prisma.announcement.create({
    data: {
      message: message.trim(),
      isActive: isAct,
    },
  });

  // Real-time broadcast to workers
  broadcast('announcement:updated', announcement);

  return success(res, announcement, 'Announcement created successfully.');
});

/**
 * PATCH /api/admin/announcements/:id
 */
const updateAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message, isActive } = req.body;

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return notFound(res, 'Announcement not found.');
  }

  const updateData = {};
  if (message !== undefined) {
    if (!message.trim()) return badRequest(res, 'Announcement message cannot be empty.');
    updateData.message = message.trim();
  }

  if (isActive !== undefined) {
    const isAct = Boolean(isActive);
    updateData.isActive = isAct;
    if (isAct) {
      // Deactivate other announcements
      await prisma.announcement.updateMany({
        where: { id: { not: id }, isActive: true },
        data: { isActive: false },
      });
    }
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: updateData,
  });

  // Real-time broadcast
  if (updated.isActive) {
    broadcast('announcement:updated', updated);
  } else {
    // If deactivated, check if any other announcement is active
    const nextActive = await prisma.announcement.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (nextActive) {
      broadcast('announcement:updated', nextActive);
    } else {
      broadcast('announcement:deleted', { id });
    }
  }

  return success(res, updated, 'Announcement updated successfully.');
});

/**
 * DELETE /api/admin/announcements/:id
 */
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return notFound(res, 'Announcement not found.');
  }

  await prisma.announcement.delete({ where: { id } });

  // Broadcast update
  const nextActive = await prisma.announcement.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  });
  if (nextActive) {
    broadcast('announcement:updated', nextActive);
  } else {
    broadcast('announcement:deleted', { id });
  }

  return success(res, null, 'Announcement deleted successfully.');
});

// ─────────────────────────────────────────────
// ADMIN ADVERTISEMENT MANAGEMENT
// ─────────────────────────────────────────────

/**
 * GET /api/admin/advertisements
 */
const getAdvertisements = asyncHandler(async (req, res) => {
  const advertisements = await prisma.advertisement.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return success(res, advertisements);
});

/**
 * POST /api/admin/advertisements/upload-image
 * Secure image upload endpoint for advertisement banners.
 * Validates MIME type, file extension, and file size (max 5MB).
 */
const uploadAdvertisementImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return badRequest(res, 'No image file uploaded.');
  }

  const file = req.file;
  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
  const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME.includes(file.mimetype) || !ALLOWED_EXT.includes(ext)) {
    // Clean up temp file if multer stored on disk
    if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return badRequest(res, 'Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.');
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_SIZE) {
    if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return badRequest(res, 'Advertisement image exceeds maximum allowed size of 5MB.');
  }

  const cleanExt = ext.replace('.jpeg', '.jpg');
  const uniqueKey = `ad-${randomUUID()}${cleanExt}`;

  let imageUrl = '';
  let imageKey = '';

  // Cloudflare R2 upload if configured
  if (isR2Configured()) {
    try {
      const fileBuffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
      if (!fileBuffer) {
        throw new Error('Unable to read file buffer');
      }

      const r2Key = `ads/${uniqueKey}`;
      await r2Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
        ContentType: file.mimetype,
        Body: fileBuffer,
      }));

      imageUrl = `${R2_PUBLIC_BASE_URL}/${r2Key}`;
      imageKey = r2Key;

      // Clean up temp disk file if exists
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch (r2Err) {
      console.warn('[R2 Upload Failed, falling back to local storage]:', r2Err.message);
    }
  }

  // Local storage fallback
  if (!imageUrl) {
    const targetPath = path.join(UPLOAD_ADS_DIR, uniqueKey);
    if (file.buffer) {
      fs.writeFileSync(targetPath, file.buffer);
    } else if (file.path) {
      fs.renameSync(file.path, targetPath);
    }
    imageUrl = `/uploads/ads/${uniqueKey}`;
    imageKey = `local:${uniqueKey}`;
  }

  return success(res, { imageUrl, imageKey }, 'Advertisement image uploaded successfully.');
});

/**
 * POST /api/admin/advertisements
 */
const createAdvertisement = asyncHandler(async (req, res) => {
  const { title = 'Paid', imageUrl, imageKey, destinationUrl, isActive = true } = req.body;

  if (!imageUrl || !imageUrl.trim()) {
    return badRequest(res, 'Advertisement image is required.');
  }

  const urlValidation = validateDestinationUrl(destinationUrl);
  if (!urlValidation.valid) {
    return badRequest(res, urlValidation.error);
  }

  const isAct = Boolean(isActive);

  // If activating, deactivate others so one clean ad is displayed
  if (isAct) {
    await prisma.advertisement.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  }

  const ad = await prisma.advertisement.create({
    data: {
      title: title ? title.trim() : 'Paid',
      imageUrl: imageUrl.trim(),
      imageKey: imageKey ? imageKey.trim() : null,
      destinationUrl: urlValidation.url,
      isActive: isAct,
    },
  });

  // Real-time broadcast
  broadcast('advertisement:updated', ad);

  return success(res, ad, 'Advertisement created successfully.');
});

/**
 * PATCH /api/admin/advertisements/:id
 */
const updateAdvertisement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, imageUrl, imageKey, destinationUrl, isActive } = req.body;

  const existing = await prisma.advertisement.findUnique({ where: { id } });
  if (!existing) {
    return notFound(res, 'Advertisement not found.');
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title ? title.trim() : null;

  if (destinationUrl !== undefined) {
    const urlValidation = validateDestinationUrl(destinationUrl);
    if (!urlValidation.valid) {
      return badRequest(res, urlValidation.error);
    }
    updateData.destinationUrl = urlValidation.url;
  }

  let oldImageToClean = null;
  if (imageUrl !== undefined && imageUrl !== existing.imageUrl) {
    updateData.imageUrl = imageUrl.trim();
    updateData.imageKey = imageKey ? imageKey.trim() : null;
    // Mark old image for safe cleanup AFTER database update succeeds
    oldImageToClean = { imageKey: existing.imageKey, imageUrl: existing.imageUrl };
  }

  if (isActive !== undefined) {
    const isAct = Boolean(isActive);
    updateData.isActive = isAct;
    if (isAct) {
      await prisma.advertisement.updateMany({
        where: { id: { not: id }, isActive: true },
        data: { isActive: false },
      });
    }
  }

  // 1. Update database
  const updated = await prisma.advertisement.update({
    where: { id },
    data: updateData,
  });

  // 2. Remove old image only after successful database update (Part 5 requirement)
  if (oldImageToClean) {
    cleanupImageFile(oldImageToClean.imageKey, oldImageToClean.imageUrl).catch(() => {});
  }

  // 3. Real-time broadcast
  if (updated.isActive) {
    broadcast('advertisement:updated', updated);
  } else {
    const nextActive = await prisma.advertisement.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (nextActive) {
      broadcast('advertisement:updated', nextActive);
    } else {
      broadcast('advertisement:deleted', { id });
    }
  }

  return success(res, updated, 'Advertisement updated successfully.');
});

/**
 * DELETE /api/admin/advertisements/:id
 */
const deleteAdvertisement = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.advertisement.findUnique({ where: { id } });
  if (!existing) {
    return notFound(res, 'Advertisement not found.');
  }

  // 1. Delete from database
  await prisma.advertisement.delete({ where: { id } });

  // 2. Clean up associated image file safely
  cleanupImageFile(existing.imageKey, existing.imageUrl).catch(() => {});

  // 3. Real-time broadcast
  const nextActive = await prisma.advertisement.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  });
  if (nextActive) {
    broadcast('advertisement:updated', nextActive);
  } else {
    broadcast('advertisement:deleted', { id });
  }

  return success(res, null, 'Advertisement deleted successfully.');
});

module.exports = {
  validateDestinationUrl,
  cleanupImageFile,
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
};
