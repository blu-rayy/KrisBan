import { useState } from 'react';

let idCounter = 1;
const genId = (prefix) => `${prefix}-${Date.now()}-${idCounter++}`;

export const WBSDebugPanel = ({ data, onChange, teamMembers, onTeamChange, memberColors }) => {
  const [newL1Label, setNewL1Label] = useState('');
  const [newL2Labels, setNewL2Labels] = useState({});
  const [newMemberName, setNewMemberName] = useState('');

  // ── Root ──────────────────────────────────────────────
  const updateRootLabel = (label) => onChange({ ...data, label });

  // ── L1 ───────────────────────────────────────────────
  const addL1 = () => {
    if (!newL1Label.trim()) return;
    onChange({
      ...data,
      children: [
        ...data.children,
        { id: genId('l1'), label: newL1Label.trim(), level: 1, children: [] },
      ],
    });
    setNewL1Label('');
  };

  const removeL1 = (l1Id) =>
    onChange({ ...data, children: data.children.filter(c => c.id !== l1Id) });

  // ── L2 ───────────────────────────────────────────────
  const addL2 = (l1Id) => {
    const label = (newL2Labels[l1Id] || '').trim();
    if (!label) return;
    onChange({
      ...data,
      children: data.children.map(c =>
        c.id === l1Id
          ? { ...c, children: [...(c.children || []), { id: genId('l2'), label, level: 2, assigneeId: null }] }
          : c
      ),
    });
    setNewL2Labels(prev => ({ ...prev, [l1Id]: '' }));
  };

  const removeL2 = (l1Id, l2Id) =>
    onChange({
      ...data,
      children: data.children.map(c =>
        c.id === l1Id ? { ...c, children: c.children.filter(l2 => l2.id !== l2Id) } : c
      ),
    });

  const setL2Assignee = (l1Id, l2Id, assigneeId) =>
    onChange({
      ...data,
      children: data.children.map(c =>
        c.id === l1Id
          ? {
              ...c,
              children: c.children.map(l2 =>
                l2.id === l2Id ? { ...l2, assigneeId: assigneeId || null } : l2
              ),
            }
          : c
      ),
    });

  // ── Team members ──────────────────────────────────────
  const addMember = () => {
    if (!newMemberName.trim()) return;
    const color = memberColors[teamMembers.length % memberColors.length];
    onTeamChange([
      ...teamMembers,
      { id: genId('tm'), name: newMemberName.trim(), color },
    ]);
    setNewMemberName('');
  };

  const removeMember = (memberId) => {
    onTeamChange(teamMembers.filter(m => m.id !== memberId));
    // Clear assignee references to removed member
    onChange({
      ...data,
      children: data.children.map(c => ({
        ...c,
        children: (c.children || []).map(l2 =>
          l2.assigneeId === memberId ? { ...l2, assigneeId: null } : l2
        ),
      })),
    });
  };

  const totalL2 = data.children.reduce((acc, c) => acc + (c.children?.length || 0), 0);

  return (
    <div className="bg-white dark:bg-dm-card rounded-[24px] shadow-card-soft dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] p-6 space-y-5 h-fit">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-500">
          Debug Panel
        </p>
        <p className="text-xs text-gray-400 dark:text-dm-muted mt-1">
          Build and test the WBS tree structure
        </p>
      </div>

      <div className="h-px bg-gray-100 dark:bg-dm-border rounded-full" />

      {/* Level 0 */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-dm-muted mb-1.5">
          Level 0 — Project Root
        </label>
        <input
          type="text"
          value={data.label}
          onChange={e => updateRootLabel(e.target.value)}
          placeholder="Project name..."
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-dm-border bg-gray-50 dark:bg-dm-elevated text-sm text-dark-charcoal dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-forest-green/30 transition-shadow"
        />
      </div>

      <div className="h-px bg-gray-100 dark:bg-dm-border rounded-full" />

      {/* Team members */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-dm-muted mb-2">
          Team Members
          <span className="ml-2 text-emerald-600 dark:text-emerald-500 font-normal">
            ({teamMembers.length})
          </span>
        </label>

        {teamMembers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {teamMembers.map(m => (
              <div key={m.id} className="flex items-center gap-1.5 pr-2 pl-1 py-1 rounded-full border border-gray-100 dark:border-dm-border bg-gray-50 dark:bg-dm-elevated">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                  style={{ backgroundColor: m.color }}
                >
                  {m.name[0].toUpperCase()}
                </div>
                <span className="text-xs text-gray-700 dark:text-dm-text font-medium">{m.name}</span>
                <button
                  onClick={() => removeMember(m.id)}
                  className="text-gray-300 hover:text-red-400 dark:text-dm-soft dark:hover:text-red-400 text-xs leading-none transition-colors ml-0.5"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newMemberName}
            onChange={e => setNewMemberName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMember()}
            placeholder="Person name..."
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-dm-border bg-gray-50 dark:bg-dm-elevated text-sm text-dark-charcoal dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-forest-green/30 transition-shadow"
          />
          <button
            onClick={addMember}
            className="px-3 py-2 bg-gray-100 dark:bg-dm-elevated text-gray-600 dark:text-dm-muted text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-dm-border transition-colors whitespace-nowrap"
          >
            + Add
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-100 dark:bg-dm-border rounded-full" />

      {/* Level 1 — Subprojects */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-dm-muted mb-2">
          Level 1 — Subprojects
          <span className="ml-2 text-emerald-600 dark:text-emerald-500 font-normal">
            ({data.children.length})
          </span>
        </label>

        <div className="space-y-3 mb-3">
          {data.children.map(l1 => (
            <div
              key={l1.id}
              className="border border-gray-100 dark:border-dm-border rounded-xl p-3 space-y-2 bg-gray-50/50 dark:bg-dm-elevated/30"
            >
              {/* L1 row */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-forest-green flex-shrink-0" />
                <span className="flex-1 text-sm font-medium text-dark-charcoal dark:text-dm-text truncate">
                  {l1.label}
                </span>
                <button
                  onClick={() => removeL1(l1.id)}
                  className="text-xs text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 px-1.5 py-0.5 rounded transition-colors flex-shrink-0"
                >
                  Remove
                </button>
              </div>

              {/* L2 items */}
              <div className="pl-4 space-y-2">
                {l1.children?.map(l2 => {
                  const assignee = teamMembers.find(m => m.id === l2.assigneeId);
                  return (
                    <div key={l2.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 dark:bg-emerald-600 flex-shrink-0" />
                        <span className="flex-1 text-xs text-gray-600 dark:text-dm-muted truncate">
                          {l2.label}
                        </span>
                        <button
                          onClick={() => removeL2(l1.id, l2.id)}
                          className="text-xs text-red-300 hover:text-red-500 dark:text-red-700 dark:hover:text-red-500 px-1.5 py-0.5 rounded transition-colors flex-shrink-0"
                        >
                          ×
                        </button>
                      </div>

                      {/* Assignee select */}
                      <div className="flex items-center gap-2 pl-3.5">
                        {assignee && (
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                            style={{ backgroundColor: assignee.color }}
                          >
                            {assignee.name[0].toUpperCase()}
                          </div>
                        )}
                        <select
                          value={l2.assigneeId || ''}
                          onChange={e => setL2Assignee(l1.id, l2.id, e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-dm-border bg-white dark:bg-dm-elevated text-xs text-gray-600 dark:text-dm-muted focus:outline-none focus:ring-2 focus:ring-forest-green/20 transition-shadow"
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}

                {/* Add L2 input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newL2Labels[l1.id] || ''}
                    onChange={e =>
                      setNewL2Labels(prev => ({ ...prev, [l1.id]: e.target.value }))
                    }
                    onKeyDown={e => e.key === 'Enter' && addL2(l1.id)}
                    placeholder="Work package..."
                    className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-dm-border bg-white dark:bg-dm-elevated text-xs text-dark-charcoal dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-forest-green/20 transition-shadow"
                  />
                  <button
                    onClick={() => addL2(l1.id)}
                    className="px-3 py-1.5 text-xs bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950 transition-colors whitespace-nowrap"
                  >
                    + L2
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add L1 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newL1Label}
            onChange={e => setNewL1Label(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addL1()}
            placeholder="Subproject name..."
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-dm-border bg-gray-50 dark:bg-dm-elevated text-sm text-dark-charcoal dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-forest-green/30 transition-shadow"
          />
          <button
            onClick={addL1}
            className="px-4 py-2 bg-gradient-action text-white text-sm rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            + L1
          </button>
        </div>
      </div>

      {/* Summary */}
      {data.children.length > 0 && (
        <>
          <div className="h-px bg-gray-100 dark:bg-dm-border rounded-full" />
          <div className="text-xs text-gray-400 dark:text-dm-muted space-y-1">
            <p><span className="font-medium text-gray-600 dark:text-dm-soft">L0:</span> 1 root</p>
            <p>
              <span className="font-medium text-gray-600 dark:text-dm-soft">L1:</span>{' '}
              {data.children.length} subproject{data.children.length !== 1 ? 's' : ''}
            </p>
            <p>
              <span className="font-medium text-gray-600 dark:text-dm-soft">L2:</span>{' '}
              {totalL2} work package{totalL2 !== 1 ? 's' : ''}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
