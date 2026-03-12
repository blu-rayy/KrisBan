import { useState, useRef, useEffect } from 'react';

/**
 * Custom styled dropdown select.
 * @param {string} id - for label htmlFor association
 * @param {string} value - current selected value
 * @param {function} onChange - called with the new value string
 * @param {{ value: string, label: string }[]} options - list of options
 * @param {string} [placeholder] - shown when value is empty
 * @param {boolean} [error] - red border when true
 * @param {string} [className] - extra classes on the root wrapper
 */
export const CustomSelect = ({ id, value, onChange, options = [], placeholder, error, className = '' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => String(o.value) === String(value));
  const displayLabel = selectedOption?.label ?? (value || '');

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border bg-white dark:bg-dm-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-forest-green focus:ring-offset-0 ${
          error
            ? 'border-red-500'
            : open
            ? 'border-forest-green'
            : 'border-gray-300 dark:border-dm-border hover:border-gray-400 dark:hover:border-dm-muted'
        }`}
      >
        <span className={displayLabel ? 'text-dark-charcoal dark:text-dm-text' : 'text-gray-400 dark:text-dm-soft'}>
          {displayLabel || placeholder || ''}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 dark:text-dm-soft flex-shrink-0 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-dm-card border border-gray-200 dark:border-dm-border rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-56 overflow-y-auto scrollbar-hide">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  String(option.value) === String(value)
                    ? 'bg-green-50 dark:bg-emerald-900/30 text-forest-green dark:text-emerald-300 font-semibold'
                    : 'text-dark-charcoal dark:text-dm-text hover:bg-gray-50 dark:hover:bg-dm-elevated'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
