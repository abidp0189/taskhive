const Decimal = require('decimal.js');

/**
 * Safe decimal addition
 */
const add = (a, b) => new Decimal(String(a)).plus(new Decimal(String(b))).toDecimalPlaces(4);

/**
 * Safe decimal subtraction
 */
const subtract = (a, b) => new Decimal(String(a)).minus(new Decimal(String(b))).toDecimalPlaces(4);

/**
 * Safe decimal multiplication
 */
const multiply = (a, b) => new Decimal(String(a)).times(new Decimal(String(b))).toDecimalPlaces(4);

/**
 * Safe decimal division
 */
const divide = (a, b) => new Decimal(String(a)).dividedBy(new Decimal(String(b))).toDecimalPlaces(4);

/**
 * Compare: returns true if a >= b
 */
const gte = (a, b) => new Decimal(String(a)).gte(new Decimal(String(b)));

/**
 * Compare: returns true if a > b
 */
const gt = (a, b) => new Decimal(String(a)).gt(new Decimal(String(b)));

/**
 * Compare: returns true if a <= b
 */
const lte = (a, b) => new Decimal(String(a)).lte(new Decimal(String(b)));

/**
 * Format as USD string
 */
const format = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    new Decimal(String(amount)).toNumber()
  );
};

/**
 * Convert to Prisma-safe Decimal string
 */
const toDecimalString = (amount) => new Decimal(String(amount)).toFixed(4);

/**
 * Zero value
 */
const ZERO = new Decimal('0');

module.exports = { add, subtract, multiply, divide, gte, gt, lte, format, toDecimalString, ZERO, Decimal };
