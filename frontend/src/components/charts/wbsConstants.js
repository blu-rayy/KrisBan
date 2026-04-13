export const CATEGORIES = [
  'Backend', 'Training', 'Documentation',
  'Infrastructure', 'Evaluation', 'Frontend', 'Externals',
];

export const CATEGORY_STYLES = {
  Backend:        'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  Training:       'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
  Documentation:  'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  Infrastructure: 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300',
  Evaluation:     'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300',
  Frontend:       'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
  Externals:      'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300',
};

export const STATUSES = ['todo', 'in-progress', 'gate', 'done'];

// dotClass used in WBSChart; editorClass used in WBSEditor buttons
export const STATUS_CONFIG = {
  'todo':        { label: 'Todo',    short: 'Todo',   dotClass: 'bg-gray-300 dark:bg-gray-600',   editorClass: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
  'in-progress': { label: 'Active',  short: 'Active', dotClass: 'bg-emerald-500',                  editorClass: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' },
  'gate':        { label: 'Gate',    short: 'Gate',   dotClass: 'bg-red-500',                      editorClass: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400' },
  'done':        { label: 'Done',    short: 'Done',   dotClass: 'bg-emerald-600', done: true,       editorClass: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' },
};

export const PRIORITY_CONFIG = {
  1: { label: 'P1', class: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',       activeClass: 'ring-2 ring-red-400' },
  2: { label: 'P2', class: 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400', activeClass: 'ring-2 ring-orange-400' },
  3: { label: 'P3', class: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-500', activeClass: 'ring-2 ring-yellow-400' },
  4: { label: 'P4', class: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',       activeClass: 'ring-2 ring-gray-400' },
};
