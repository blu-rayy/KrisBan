/**
 * Strict Color Mapping System for Dashboard Badges
 * 
 * Prevents visual clashing by assigning fixed colors to:
 * - Members: Cool/Floral tones (Blue, Fuchsia, Rose, Indigo)
 * - Categories: Label colors (Sky, Amber, Slate, Violet) - avoiding Green (reserved for Sprints)
 * - Sprints: Emerald Green (handled by SprintBadge component)
 */

// Member Color Mapping (Cool/Floral Tones)
const MEMBER_COLORS = {
  'Kristian': 'blue',
  'Marianne': 'fuchsia',
  'Angel': 'rose',
  'Michael': 'indigo'
};

// Category Color Mapping (Label Colors - NO Green to avoid Sprint clash)
const CATEGORY_COLORS = {
  'Software Development': 'sky',
  'Research': 'amber',
  'Operations': 'slate',
  'Project Management': 'violet'
};

// Predefined Tailwind Ring Classes using Modern Ring Syntax
// Format: bg-{color}-50 text-{color}-700 ring-1 ring-inset ring-{color}-600/20
const RING_CLASSES = {
  blue: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-700 ring-1 ring-inset ring-fuchsia-600/20',
  rose: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20',
  indigo: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20',
  sky: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  slate: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20',
  violet: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20'
};

/**
 * Get strict badge styling based on type and value
 * 
 * @param {string} type - Either 'member' or 'category'
 * @param {string} value - The member name or category name
 * @returns {string} Tailwind class string with modern ring syntax
 * 
 * @example
 * getBadgeStyle('member', 'Kristian') // Returns blue ring classes
 * getBadgeStyle('category', 'Software Development') // Returns sky ring classes
 * getBadgeStyle('member', 'Unknown') // Returns slate (default)
 */
export const getBadgeStyle = (type, value) => {
  let colorKey = 'slate'; // Default fallback

  if (type === 'member') {
    colorKey = MEMBER_COLORS[value] || 'slate';
  } else if (type === 'category') {
    colorKey = CATEGORY_COLORS[value] || 'slate';
  }

  return RING_CLASSES[colorKey];
};

/**
 * Get only the color name (for reference)
 */
export const getColorName = (type, value) => {
  if (type === 'member') {
    return MEMBER_COLORS[value] || 'slate';
  } else if (type === 'category') {
    return CATEGORY_COLORS[value] || 'slate';
  }
  return 'slate';
};

/**
 * Color mappings reference (for documentation)
 */
export const COLOR_MAPPINGS = {
  members: MEMBER_COLORS,
  categories: CATEGORY_COLORS,
  ringClasses: RING_CLASSES
};
