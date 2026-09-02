'use strict';

const { S3Client } = require('@aws-sdk/client-s3');

/**
 * Cloudflare R2 S3-compatible client.
 *
 * R2 uses the S3 API via a custom endpoint:
 *   https://<accountId>.r2.cloudflarestorage.com
 *
 * Required environment variables (set in Render dashboard, never commit):
 *   R2_ACCOUNT_ID        — Cloudflare account ID (hex string)
 *   R2_ACCESS_KEY_ID     — R2 API token access key ID
 *   R2_SECRET_ACCESS_KEY — R2 API token secret
 *   R2_BUCKET_NAME       — Production bucket name (e.g. tomarkaj-production)
 *   R2_PUBLIC_BASE_URL   — Custom public domain (e.g. https://cdn.tomarkaj.com)
 *                          Only for truly public assets. Proof files use signed URLs.
 */

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME || '';
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL || '';

/**
 * Check whether R2 is configured via environment variables.
 * In development, falls back to base64 if R2 vars are absent.
 */
function isR2Configured() {
  return (
    !!process.env.R2_ACCOUNT_ID &&
    !!process.env.R2_ACCESS_KEY_ID &&
    !!process.env.R2_SECRET_ACCESS_KEY &&
    !!process.env.R2_BUCKET_NAME
  );
}

module.exports = { r2Client, R2_BUCKET, R2_PUBLIC_BASE_URL, isR2Configured };
