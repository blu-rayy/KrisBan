import { useState, useRef, useEffect } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameDay, isSameMonth, parseISO, isValid
} from 'date-fns';

/**
 * Custom DatePicker — KrisBan themed, light + dark mode.
 *
 * Props mirror a native <input type="date" /> for drop-in replacement:
 *   value      – YYYY-MM-DD string
 *   onChange   – called as onChange({ target: { name, value } })
 *   name / id  – forwarded to synthetic event
 *   placeholder, className, error, disabled
 */
export const DatePicker = ({
  id,
  name,
  value = '',
  onChange,
  placeholder = 'Select date',
  className = '',
  error = false,
  disabled = false,
}) => {
  const selectedDate = value && isValid(parseISO(value)) ? parseISO(value) : null;
  const [viewMonth, setViewMonth] = useState(selectedDate ?? new Date());
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onMouse = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Keep viewMonth in sync if value changes externally
  useEffect(() => {
    if (selectedDate) setViewMonth(selectedDate);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const emit = (val) => {
    onChange?.({ target: { name: name ?? id ?? '', value: val } });
  };

  const handleSelect = (date) => {
    emit(format(date, 'yyyy-MM-dd'));
    setOpen(false);
  };

  // Build 6-week grid
  const monthStart = startOfMonth(viewMonth);
  const calStart   = startOfWeek(monthStart);
  const calEnd     = endOfWeek(endOfMonth(viewMonth));
  const rows = [];
  let cursor = calStart;
  while (cursor <= calEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) { week.push(cursor); cursor = addDays(cursor, 1); }
    rows.push(week);
  }

  const today = new Date();

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`w-full px-3 py-2 text-sm text-left border rounded-lg transition outline-none
          focus:ring-2 focus:ring-forest-green focus:border-transparent
          bg-white dark:bg-dm-elevated
          ${error ? 'border-red-500 dark:border-red-700' : 'border-gray-300 dark:border-dm-border'}
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          ${selectedDate ? 'text-dark-charcoal dark:text-dm-text' : 'text-gray-400 dark:text-dm-soft'}`}
      >
        <span className="flex items-center justify-between gap-2">
          <span>{selectedDate ? format(selectedDate, 'MM/dd/yyyy') : placeholder}</span>
          <svg className="w-4 h-4 flex-shrink-0 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
      </button>

      {/* Popup */}
      {open && (
        <div className="absolute z-50 mt-1 w-72 rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-card shadow-xl overflow-hidden">
          {/* Month nav — forest gradient header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-hero">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition text-lg leading-none"
            >‹</button>
            <span className="text-sm font-semibold text-white select-none">
              {format(viewMonth, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition text-lg leading-none"
            >›</button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 bg-slate-50 dark:bg-dm-elevated border-b border-slate-100 dark:border-dm-border">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 dark:text-dm-muted select-none">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="p-2 space-y-0.5">
            {rows.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-0.5">
                {week.map((d, di) => {
                  const sel    = selectedDate && isSameDay(d, selectedDate);
                  const isNow  = isSameDay(d, today);
                  const inMon  = isSameMonth(d, viewMonth);
                  return (
                    <button
                      key={di}
                      type="button"
                      onClick={() => handleSelect(d)}
                      className={`w-full aspect-square rounded-lg text-xs font-medium transition select-none
                        ${sel
                          ? 'bg-gradient-action text-white shadow-sm'
                          : isNow
                          ? 'border border-forest-green text-forest-green dark:text-emerald-400 dark:border-emerald-400 font-semibold'
                          : inMon
                          ? 'text-slate-700 dark:text-dm-text hover:bg-emerald-50 dark:hover:bg-dm-elevated'
                          : 'text-slate-300 dark:text-dm-soft hover:bg-slate-50 dark:hover:bg-dm-elevated'
                        }`}
                    >
                      {format(d, 'd')}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer: Today / Clear */}
          <div className="flex justify-between items-center px-4 py-2 border-t border-slate-100 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated">
            <button
              type="button"
              onClick={() => handleSelect(new Date())}
              className="text-xs font-medium text-forest-green dark:text-emerald-400 hover:opacity-75 transition"
            >Today</button>
            <button
              type="button"
              onClick={() => { emit(''); setOpen(false); }}
              className="text-xs font-medium text-slate-400 dark:text-dm-muted hover:opacity-75 transition"
            >Clear</button>
          </div>
        </div>
      )}
    </div>
  );
};
