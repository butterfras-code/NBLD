import { Difficulty } from '../constants.js';

/**
 * Get human-readable difficulty label
 */
export const getDifficultyLabel = (diff) => {
  const labels = {
    1: 'Beginner',
    2: 'High Beginner',
    3: 'Improver',
    4: 'High Improver',
    5: 'Low Intermediate',
    6: 'Intermediate',
    7: 'High Intermediate',
    8: 'Advanced'
  };
  return labels[diff] || 'Unknown';
};

/**
 * Get Tailwind CSS classes for difficulty color coding
 */
export const getDifficultyColor = (diff) => {
  if (diff <= 2) return 'bg-green-100 text-green-800';
  if (diff <= 4) return 'bg-blue-100 text-blue-800';
  if (diff <= 6) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

/**
 * Normalize date string to YYYY-MM-DD format
 */
export const normalizeDate = (d) => {
  return d.includes('T') ? d.split('T')[0] : d;
};

/**
 * Parse YYYY-MM-DD string to Date object
 */
export const parseYMD = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Sanitize string for use as ID
 */
export const sanitizeId = (s) => {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
};
