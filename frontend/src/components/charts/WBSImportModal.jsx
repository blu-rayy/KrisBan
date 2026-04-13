import { useRef, useState } from 'react';
import { wbsService } from '../../services/api';

const TEMPLATE = {
  name: "Week 3",
  summary: "Optional one-line summary shown above the WBS tree.",
  carryForward: "Optional notes carried over from the previous board.",
  gates: [
    {
      description: "Ethics clearance approved",
      unblocks: "Data collection phase"
    }
  ],
  pinnedIssues: [
    { description: "API latency still above threshold" }
  ],
  deliverables: [
    {
      assigneeId: "uuid-of-member-or-omit",
      description: "Initial prototype demo ready"
    }
  ],
  wbsData: {
    label: "My Project",
    children: [
      {
        label: "Backend",
        assigneeId: "uuid-of-member-or-omit",
        children: [
          {
            label: "Set up REST API",
            assigneeId: "uuid-of-member-or-omit",
            status: "in-progress",
            day: "2026-04-14",
            category: "Backend",
            priority: 1,
            note: "Why this task exists or any relevant context."
          },
          {
            label: "Write unit tests",
            status: "todo",
            day: "2026-04-15",
            category: "Backend",
            priority: 2
          }
        ]
      },
      {
        label: "Documentation",
        children: [
          {
            label: "Draft system design doc",
            status: "todo",
            day: "2026-04-16",
            category: "Documentation",
            priority: 3
          }
        ]
      }
    ]
  }
};

const FIELD_DOCS = [
  { field: 'name',          req: true,  type: 'string',                         note: 'Board / week name shown in the selector.' },
  { field: 'summary',       req: false, type: 'string',                         note: 'Shown as a green bar above the WBS tree.' },
  { field: 'carryForward',  req: false, type: 'string',                         note: 'Shown as an amber bar above the WBS tree.' },
  { field: 'gates',         req: false, type: 'array of { description, unblocks? }', note: 'Blockers / review gates. Rendered red.' },
  { field: 'pinnedIssues',  req: false, type: 'array of { description }',       note: 'Sticky issues shown below the tree.' },
  { field: 'deliverables',  req: false, type: 'array of { assigneeId?, description }', note: 'Outputs grouped by assignee.' },
  { field: 'wbsData',       req: true,  type: 'object',                         note: 'Root node of the work breakdown structure.' },
  { field: 'wbsData.label', req: true,  type: 'string',                         note: 'Text on the root pill (e.g. "My Project").' },
  { field: 'wbsData.children', req: true, type: 'array',                        note: 'L1 subproject nodes. Each can have children (L2 work packages).' },
  { field: 'L1: label',     req: true,  type: 'string',                         note: 'Subproject name.' },
  { field: 'L1: assigneeId',req: false, type: 'uuid string',                    note: 'Optional default assignee for the whole subproject.' },
  { field: 'L2: label',     req: true,  type: 'string',                         note: 'Work package name.' },
  { field: 'L2: assigneeId',req: false, type: 'uuid string',                    note: 'Team member UUID. Must be in your team.' },
  { field: 'L2: status',    req: false, type: '"todo" | "in-progress" | "gate" | "done"', note: 'Gate = red, Done = dimmed with checkmark.' },
  { field: 'L2: day',       req: false, type: '"YYYY-MM-DD"',                   note: 'ISO date. Used as the column in Matrix view.' },
  { field: 'L2: category',  req: false, type: '"Backend" | "Training" | "Documentation" | "Infrastructure" | "Evaluation" | "Frontend" | "Externals"', note: 'Shown as a colored chip.' },
  { field: 'L2: priority',  req: false, type: '1 | 2 | 3 | 4',                 note: 'P1 = highest. Shown as a colored badge.' },
  { field: 'L2: note',      req: false, type: 'string',                         note: 'Shown as a tooltip on hover in both tree and matrix views.' },
];

export const WBSImportModal = ({ onClose, onSuccess }) => {
  const [raw, setRaw]               = useState('');
  const [showTemplate, setShowTemplate] = useState(false);
  const [error, setError]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const fileRef                     = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRaw(ev.target.result ?? '');
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    setError(null);
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setError('Invalid JSON — check for missing commas, unclosed brackets, or trailing commas.');
      return;
    }
    setLoading(true);
    try {
      const res = await wbsService.import(parsed);
      onSuccess(res.data?.boardId);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Import failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-dm-card rounded-[24px] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-dm-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-dark-charcoal dark:text-dm-text">Import WBS Board</h2>
            <p className="text-xs text-gray-500 dark:text-dm-muted mt-0.5">Paste JSON or upload a .json file — a new board will be appended to your existing boards.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-dm-soft hover:text-gray-600 dark:hover:text-dm-text hover:bg-gray-100 dark:hover:bg-dm-elevated transition-colors flex-shrink-0"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <line x1="2" y1="2" x2="14" y2="14"/><line x1="14" y1="2" x2="2" y2="14"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Input area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-dm-muted">JSON Payload</label>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-forest-green dark:text-emerald-400 hover:underline"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M2 12v2h12v-2M8 2v8M5 5l3-3 3 3"/>
                </svg>
                Upload .json file
              </button>
              <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
            </div>
            <textarea
              value={raw}
              onChange={(e) => { setRaw(e.target.value); setError(null); }}
              placeholder={'{\n  "name": "Week 3",\n  "wbsData": { ... }\n}'}
              rows={10}
              spellCheck={false}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dm-border bg-gray-50 dark:bg-dm-elevated text-xs text-dark-charcoal dark:text-dm-text font-mono focus:outline-none focus:ring-2 focus:ring-forest-green/20 resize-none transition-shadow placeholder-gray-300 dark:placeholder-dm-soft/40"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Template reference */}
          <div className="rounded-xl border border-gray-100 dark:border-dm-border overflow-hidden">
            <button
              onClick={() => setShowTemplate(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-dm-elevated/60 text-xs font-semibold text-gray-600 dark:text-dm-muted hover:bg-gray-100 dark:hover:bg-dm-elevated transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <circle cx="8" cy="8" r="6"/><line x1="8" y1="6" x2="8" y2="8"/><circle cx="8" cy="11" r="0.5" fill="currentColor"/>
                </svg>
                Template &amp; field reference
              </span>
              <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showTemplate ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6l4 4 4-4"/>
              </svg>
            </button>

            {showTemplate && (
              <div className="divide-y divide-gray-100 dark:divide-dm-border">

                {/* Field table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50/60 dark:bg-dm-elevated/30">
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 dark:text-dm-soft uppercase tracking-wide w-36">Field</th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 dark:text-dm-soft uppercase tracking-wide w-16">Required</th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 dark:text-dm-soft uppercase tracking-wide">Type / Values</th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 dark:text-dm-soft uppercase tracking-wide">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FIELD_DOCS.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-dm-card' : 'bg-gray-50/40 dark:bg-dm-elevated/10'}>
                          <td className="px-4 py-2 font-mono text-[11px] text-forest-green dark:text-emerald-400 whitespace-nowrap align-top">{row.field}</td>
                          <td className="px-4 py-2 align-top">
                            {row.req
                              ? <span className="text-red-500 dark:text-red-400 font-semibold">yes</span>
                              : <span className="text-gray-300 dark:text-dm-soft/50">no</span>}
                          </td>
                          <td className="px-4 py-2 font-mono text-[10px] text-gray-600 dark:text-dm-muted align-top whitespace-pre-wrap">{row.type}</td>
                          <td className="px-4 py-2 text-[11px] text-gray-500 dark:text-dm-muted align-top">{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Template JSON */}
                <div className="px-4 py-3 bg-gray-50/60 dark:bg-dm-elevated/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-dm-soft uppercase tracking-wide">Example JSON</span>
                    <button
                      onClick={() => setRaw(JSON.stringify(TEMPLATE, null, 2))}
                      className="text-[10px] text-forest-green dark:text-emerald-400 hover:underline"
                    >
                      Use this as starting point →
                    </button>
                  </div>
                  <pre className="text-[10px] text-gray-600 dark:text-dm-muted font-mono leading-relaxed overflow-x-auto whitespace-pre">
                    {JSON.stringify(TEMPLATE, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-dm-border flex-shrink-0 bg-white dark:bg-dm-card">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 dark:text-dm-muted hover:text-gray-700 dark:hover:text-dm-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!raw.trim() || loading}
            className="px-5 py-2 text-sm font-medium bg-gradient-action text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? 'Importing…' : 'Import Board'}
          </button>
        </div>
      </div>
    </div>
  );
};
