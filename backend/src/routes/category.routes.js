const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { success } = require('../utils/response');
const { asyncHandler } = require('../middleware/error.middleware');

// Public: get all active categories with subcategories
router.get('/', asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: { subcategories: { where: { isActive: true } } },
    orderBy: { sortOrder: 'asc' },
  });
  return success(res, categories);
}));

// Public: get countries
router.get('/countries', asyncHandler(async (req, res) => {
  const countries = await prisma.country.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  return success(res, countries);
}));

module.exports = router;
