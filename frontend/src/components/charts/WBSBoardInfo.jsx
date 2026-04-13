import { useState } from 'react';

const ChevronIcon = ({ open }) => (
  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6l4 4 4-4" />
  </svg>
);

const SectionHeader = ({ label, count, open, onToggle, colorClass = 'text-gray-500 dark:text-dm-muted' }) => (
  <button onClick={onToggle} className="flex items-center gap-1.5 w-full text-left group">
    <span className={`text-xs font-semibold ${colorClass}`}>{label}</span>
    {count != null && <span className="text-xs text-gray-400 dark:text-dm-soft">({count})</span>}
    <span className="ml-auto text-gray-400 dark:text-dm-soft group-hover:text-gray-600 dark:group-hover:text-dm-muted transition-colors">
      <ChevronIcon open={open} />
    </span>
  </button>
);

const inputCls = 'w-full min-w-0 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-dm-border bg-white dark:bg-dm-elevated text-xs text-dark-charcoal dark:text-dm-text focus:outline-none focus:ring-2 transition-shadow';

export const WBSBoardInfo = ({ boardMeta, onBoardMetaChange, allUsers }) => {
  const [gatesOpen, setGatesOpen] = useState(true);
  const [issuesOpen, setIssuesOpen] = useState(true);
  const [delivOpen, setDelivOpen] = useState(true);
  const [newGate, setNewGate] = useState({ description: '', unblocks: '' });
  const [newIssue, setNewIssue] = useState('');
  const [newDeliv, setNewDeliv] = useState({ assigneeId: '', description: '' });

  const meta = boardMeta || {};
  const gates = meta.gates || [];
  const issues = meta.pinnedIssues || [];
  const deliverables = meta.deliverables || [];

  const update = (field, value) => onBoardMetaChange({ [field]: value });

  // Gates
  const addGate = () => {
    if (!newGate.description.trim()) return;
    update('gates', [...gates, { description: newGate.description.trim(), unblocks: newGate.unblocks.trim() || null }]);
    setNewGate({ description: '', unblocks: '' });
  };
  const removeGate = (i) => update('gates', gates.filter((_, idx) => idx !== i));

  // Pinned Issues
  const addIssue = () => {
    if (!newIssue.trim()) return;
    update('pinnedIssues', [...issues, { description: newIssue.trim() }]);
    setNewIssue('');
  };
  const removeIssue = (i) => update('pinnedIssues', issues.filter((_, idx) => idx !== i));

  // Deliverables
  const addDeliv = () => {
    if (!newDeliv.description.trim()) return;
    update('deliverables', [...deliverables, {
      assigneeId: newDeliv.assigneeId || null,
      description: newDeliv.description.trim(),
    }]);
    setNewDeliv({ assigneeId: '', description: '' });
  };
  const removeDeliv = (i) => update('deliverables', deliverables.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">

      {/* Board Name */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-dm-muted mb-1.5">Board Name</label>
        <input
          type="text"
          value={meta.name || ''}
          onChange={e => update('name', e.target.value)}
          className="w-full min-w-0 px-3 py-2 rounded-lg border border-gray-200 dark:border-dm-border bg-gray-50 dark:bg-dm-elevated text-sm text-dark-charcoal dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-forest-green/30 transition-shadow"
        />
      </div>

      {/* Summary */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-dm-muted mb-1.5">Summary</label>
        <textarea
          value={meta.summary || ''}
          onChange={e => update('summary', e.target.value)}
          rows={3}
          placeholder="This week's focus..."
          className="w-full min-w-0 px-3 py-2 rounded-lg border border-gray-200 dark:border-dm-border bg-gray-50 dark:bg-dm-elevated text-xs text-dark-charcoal dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-forest-green/30 transition-shadow resize-none"
        />
      </div>

      {/* Carry Forward */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-dm-muted mb-1.5">Carry Forward</label>
        <textarea
          value={meta.carryForward || ''}
          onChange={e => update('carryForward', e.target.value)}
          rows={2}
          placeholder="What slipped from last week..."
          className="w-full min-w-0 px-3 py-2 rounded-lg border border-gray-200 dark:border-dm-border bg-gray-50 dark:bg-dm-elevated text-xs text-dark-charcoal dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-forest-green/30 transition-shadow resize-none"
        />
      </div>

      <div className="h-px bg-gray-100 dark:bg-dm-border rounded-full" />

      {/* Gates */}
      <div className="space-y-2">
        <SectionHeader
          label="Gates"
          count={gates.length}
          open={gatesOpen}
          onToggle={() => setGatesOpen(v => !v)}
          colorClass="text-red-600 dark:text-red-500"
        />
        {gatesOpen && (
          <>
            {gates.map((g, i) => (
              <div key={i} className="p-2 rounded-lg bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 space-y-0.5">
                <div className="flex items-start gap-2">
                  <span className="flex-1 min-w-0 text-xs text-gray-700 dark:text-dm-text">{g.description}</span>
                  <button onClick={() => removeGate(i)} className="flex-shrink-0 text-xs text-red-400 hover:text-red-600 px-1 transition-colors">×</button>
                </div>
                {g.unblocks && (
                  <p className="text-[10px] text-gray-400 dark:text-dm-muted">Unblocks: {g.unblocks}</p>
                )}
              </div>
            ))}
            <div className="space-y-1.5">
              <input
                type="text"
                value={newGate.description}
                onChange={e => setNewGate(p => ({ ...p, description: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addGate()}
                placeholder="Gate description..."
                className={`${inputCls} focus:ring-red-300/40`}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGate.unblocks}
                  onChange={e => setNewGate(p => ({ ...p, unblocks: e.target.value }))}
                  placeholder="Unblocks... (optional)"
                  className={`flex-1 ${inputCls} focus:ring-red-300/40`}
                />
                <button
                  onClick={addGate}
                  className="flex-shrink-0 px-3 py-1.5 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-950 transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pinned Issues */}
      <div className="space-y-2">
        <SectionHeader
          label="Pinned Issues"
          count={issues.length}
          open={issuesOpen}
          onToggle={() => setIssuesOpen(v => !v)}
          colorClass="text-violet-600 dark:text-violet-400"
        />
        {issuesOpen && (
          <>
            {issues.map((issue, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40">
                <span className="flex-1 min-w-0 text-xs text-gray-700 dark:text-dm-text">{issue.description}</span>
                <button onClick={() => removeIssue(i)} className="flex-shrink-0 text-xs text-red-400 hover:text-red-600 px-1 transition-colors">×</button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newIssue}
                onChange={e => setNewIssue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addIssue()}
                placeholder="Issue description..."
                className={`flex-1 ${inputCls} focus:ring-violet-300/40`}
              />
              <button
                onClick={addIssue}
                className="flex-shrink-0 px-3 py-1.5 text-xs bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-950 transition-colors"
              >
                + Add
              </button>
            </div>
          </>
        )}
      </div>

      {/* Deliverables */}
      <div className="space-y-2">
        <SectionHeader
          label="Deliverables"
          count={deliverables.length}
          open={delivOpen}
          onToggle={() => setDelivOpen(v => !v)}
          colorClass="text-teal-600 dark:text-teal-400"
        />
        {delivOpen && (
          <>
            {deliverables.map((d, i) => {
              const assignee = allUsers.find(u => u.id === d.assigneeId);
              return (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40">
                  {assignee && (
                    <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 flex-shrink-0">
                      {assignee.fullName.split(' ')[0]}:
                    </span>
                  )}
                  <span className="flex-1 min-w-0 text-xs text-gray-700 dark:text-dm-text">{d.description}</span>
                  <button onClick={() => removeDeliv(i)} className="flex-shrink-0 text-xs text-red-400 hover:text-red-600 px-1 transition-colors">×</button>
                </div>
              );
            })}
            <div className="space-y-1.5">
              <select
                value={newDeliv.assigneeId}
                onChange={e => setNewDeliv(p => ({ ...p, assigneeId: e.target.value }))}
                className={`${inputCls} focus:ring-teal-300/40`}
              >
                <option value="">Assignee (optional)</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.fullName}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDeliv.description}
                  onChange={e => setNewDeliv(p => ({ ...p, description: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addDeliv()}
                  placeholder="Deliverable..."
                  className={`flex-1 ${inputCls} focus:ring-teal-300/40`}
                />
                <button
                  onClick={addDeliv}
                  className="flex-shrink-0 px-3 py-1.5 text-xs bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-950 transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
