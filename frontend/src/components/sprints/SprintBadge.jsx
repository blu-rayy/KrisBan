// Fun color palette for deterministic color assignment
const FUN_COLORS = [
  'pink',
  'purple',
  'fuchsia',
  'violet',
  'indigo',
  'cyan',
  'teal',
  'emerald',
  'lime',
  'amber',
  'orange',
  'rose'
];

// Predefined Tailwind class combinations for each color (following 100/800 rule)
const COLOR_CLASSES = {
  pink: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-800',
  purple: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900/40 dark:text-fuchsia-300 dark:border-fuchsia-800',
  violet: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800',
  cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800',
  teal: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
  lime: 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/40 dark:text-lime-300 dark:border-lime-800',
  amber: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
  orange: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800',
  rose: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800',
  gray: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-dm-elevated dark:text-dm-muted dark:border-dm-border'
};

// Deterministic color picker using improved string hashing
const getColor = (text) => {
  if (!text) return 'gray';
  
  // Better hash function: uses prime number multiplication and XOR
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char; // hash * 31 + char
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use modulo to pick a color from the palette
  const colorIndex = Math.abs(hash) % FUN_COLORS.length;
  return FUN_COLORS[colorIndex];
};

/**
 * SprintBadge Component
 * 
 * A reusable badge component for sprints and tags that:
 * - Uses database-stored colors if available (no collisions)
 * - Falls back to index-based color cycling (ensures no repetition)
 * - Uses text hashing only as final fallback
 * - Follows the 100/800 Tailwind rule for readability (bg-100, text-800, border-200)
 * - Maintains a subtle pill aesthetic
 * 
 * @param {string} label - The sprint/tag name to display
 * @param {string} className - Optional additional CSS classes
 * @param {string} colorName - Optional color from database (takes priority)
 * @param {number} index - Optional index for cycling through palette (prevents collisions)
 */
export const SprintBadge = ({ label, className = '', colorName, index }) => {
  let color;
  
  // Priority 1: Use database color if provided
  if (colorName && COLOR_CLASSES[colorName]) {
    color = colorName;
  }
  // Priority 2: Use index to cycle through palette (ensures no repetition)
  else if (index !== undefined) {
    color = FUN_COLORS[index % FUN_COLORS.length];
  }
  // Priority 3: Fall back to hash-based color
  else {
    color = getColor(label);
  }
  
  const colorClasses = COLOR_CLASSES[color] || COLOR_CLASSES.gray;
  const badgeClass = `inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium border ${colorClasses} ${className}`;
  
  return (
    <span className={badgeClass}>
      {label}
    </span>
  );
};

export default SprintBadge;
