import { useState } from 'react';
import { CATEGORIES, CATEGORY_STYLES, PRIORITY_CONFIG, STATUSES, STATUS_CONFIG } from './wbsConstants';
import { WBSBoardInfo } from './WBSBoardInfo';

let idCounter = 1;
const genId = (prefix) => `${prefix}-${Date.now()}-${idCounter++}`;

const ChevronIcon = ({ open }) => (
  <svg className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6l4 4 4-4" />
  </svg>
);

const SectionHeader = ({ label, count, open, onToggle }) => (
  <button onClick={onToggle} className="flex items-center gap-1.5 w-full text-left group">
    <span className="text-xs font-semibold text-gray-500 dark:text-dm-muted">{label}</span>
    <span className="text-xs text-emerald-600 dark:text-emerald-500">({count})</span>
    <span className="ml-auto text-gray-400 dark:text-dm-soft group-hover:text-gray-600 dark:group-hover:text-dm-muted transition-colors">
      <ChevronIcon open={open} />
    </span>
  </button>
);

const UserAvatar = ({ user, color }) => {
  if (user.profilePicture) {
    return <img src={user.profilePicture} alt={user.fullName} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: color }}>
      {user.fullName?.[0]?.toUpperCase()}
    </div>
  );
};

const fieldInputCls = 'w-full min-w-0 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-dm-border bg-white dark:bg-dm-elevated text-xs text-dark-charcoal dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-forest-green/20 transition-shadow';

export const WBSEditor = ({
  data, onChange,
  selectedMemberIds, onMemberToggle,
  allUsers, memberColors,
  boardMeta, onBoardMetaChange,
  onL2Add,
}) => {
  const [newL1Label, setNewL1Label] = useState('');
  const [newL2Labels, setNewL2Labels] = useState({});
  const [expandedL2s, setExpandedL2s] = useState(new Set());
  const [membersOpen, setMembersOpen] = useState(true);
  const [subprojectsOpen, setSubprojectsOpen] = useState(true);
  const [boardInfoOpen, setBoardInfoOpen] = useState(false);

  // ── Root ──────────────────────────────────────────────────────────────────
  const updateRootLabel = (label) => onChange({ ...data, label });

  // ── L1 ────────────────────────────────────────────────────────────────────
  const addL1 = () => {
    if (!newL1Label.trim()) return;
    onChange({
      ...data,
      children: [...data.children, { id: genId('l1'), label: newL1Label.trim(), level: 1, children: [] }],
    });
    setNewL1Label('');
  };

  const removeL1 = (l1Id) =>
    onChange({ ...data, children: data.children.filter(c => c.id !== l1Id) });

  // ── L2 ────────────────────────────────────────────────────────────────────
  const addL2 = (l1Id) => {
    const label = (newL2Labels[l1Id] || '').trim();
    if (!label) return;
    const newNode = { id: genId('l2'), label, level: 2, assigneeId: null };
    onChange({
      ...data,
      children: data.children.map(c =>
        c.id === l1Id
          ? { ...c, children: [...(c.children || []), newNode] }
          : c
      ),
    });
    setNewL2Labels(prev => ({ ...prev, [l1Id]: '' }));
    if (onL2Add) onL2Add(newNode);
  };

  const removeL2 = (l1Id, l2Id) => {
    setExpandedL2s(prev => { const next = new Set(prev); next.delete(l2Id); return next; });
    onChange({
      ...data,
      children: data.children.map(c =>
        c.id === l1Id ? { ...c, children: c.children.filter(l2 => l2.id !== l2Id) } : c
      ),
    });
  };

  const updateL2Field = (l1Id, l2Id, field, value) =>
    onChange({
      ...data,
      children: data.children.map(c =>
        c.id === l1Id
          ? { ...c, children: c.children.map(l2 => l2.id === l2Id ? { ...l2, [field]: value } : l2) }
          : c
      ),
    });

  const toggleL2Expand = (l2Id) =>
    setExpandedL2s(prev => {
      const next = new Set(prev);
      next.has(l2Id) ? next.delete(l2Id) : next.add(l2Id);
      return next;
    });

  // ── Team members ──────────────────────────────────────────────────────────
  const toggleMember = (userId) => {
    if (selectedMemberIds.includes(userId)) {
      // Clear assignee refs before removing
      onChange({
        ...data,
        children: data.children.map(c => ({
          ...c,
          children: (c.children || []).map(l2 =>
            l2.assigneeId === userId ? { ...l2, assigneeId: null } : l2
          ),
        })),
      });
    }
    onMemberToggle(userId);
  };

  const selectedUsers = allUsers.filter(u => selectedMemberIds.includes(u.id));
  const totalL2 = data.children.reduce((acc, c) => acc + (c.children?.length || 0), 0);

  return (
    <div className="bg-white dark:bg-dm-card rounded-[24px] shadow-card-soft dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] p-6 space-y-5 h-fit overflow-hidden">

      {/* Project Root */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-dm-muted mb-1.5">Project Root</label>
        <input
          type="text"
          value={data.label}
          onChange={e => updateRootLabel(e.target.value)}
          placeholder="Project name..."
          className="w-full min-w-0 px-3 py-2 rounded-lg border border-gray-200 dark:border-dm-border bg-gray-50 dark:bg-dm-elevated text-sm text-dark-charcoal dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-forest-green/30 transition-shadow"
        />
      </div>

      <div className="h-px bg-gray-100 dark:bg-dm-border rounded-full" />

      {/* Team Members */}
      <div className="space-y-3">
        <SectionHeader label="Team Members" count={selectedMemberIds.length} open={membersOpen} onToggle={() => setMembersOpen(v => !v)} />
        {membersOpen && (
          <div className="flex flex-wrap gap-2">
            {allUsers.map((u, idx) => {
              const selected = selectedMemberIds.includes(u.id);
              const color = memberColors[selectedMemberIds.indexOf(u.id) % memberColors.length] ?? memberColors[idx % memberColors.length];
              return (
                <button
                  key={u.id}
                  onClick={() => toggleMember(u.id)}
                  className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
                    selected
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      : 'border-gray-200 dark:border-dm-border bg-gray-50 dark:bg-dm-elevated text-gray-500 dark:text-dm-muted opacity-60 hover:opacity-100'
                  }`}
                >
                  <UserAvatar user={u} color={color} />
                  <span>{u.fullName}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-px bg-gray-100 dark:bg-dm-border rounded-full" />

      {/* Subprojects */}
      <div className="space-y-3">
        <SectionHeader label="Subprojects" count={data.children.length} open={subprojectsOpen} onToggle={() => setSubprojectsOpen(v => !v)} />

        {subprojectsOpen && (
          <>
            {data.children.length > 0 && (
              <div className="space-y-3">
                {data.children.map(l1 => (
                  <div key={l1.id} className="border border-gray-100 dark:border-dm-border rounded-xl p-3 space-y-2 bg-gray-50/50 dark:bg-dm-elevated/30">

                    {/* L1 header row */}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-forest-green flex-shrink-0" />
                      <span className="flex-1 min-w-0 text-sm font-medium text-dark-charcoal dark:text-dm-text truncate">{l1.label}</span>
                      <button onClick={() => removeL1(l1.id)} className="flex-shrink-0 text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded transition-colors">Remove</button>
                    </div>

                    {/* L2 items */}
                    <div className="pl-4 space-y-3">
                      {l1.children?.map(l2 => {
                        const assignee = selectedUsers.find(u => u.id === l2.assigneeId);
                        const assigneeIdx = selectedMemberIds.indexOf(l2.assigneeId);
                        const assigneeColor = memberColors[assigneeIdx % memberColors.length];
                        const expanded = expandedL2s.has(l2.id);

                        return (
                          <div key={l2.id} className="border border-gray-100 dark:border-dm-border/60 rounded-lg overflow-hidden">
                            {/* L2 collapsed row */}
                            <div className="flex items-center gap-2 px-2 py-1.5 bg-white dark:bg-dm-elevated/50">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 dark:bg-emerald-600 flex-shrink-0" />
                              <span className="flex-1 min-w-0 text-xs text-gray-600 dark:text-dm-muted truncate">{l2.label}</span>
                              {/* Status dot preview */}
                              {l2.status && STATUS_CONFIG[l2.status] && (
                                STATUS_CONFIG[l2.status].done
                                  ? <span className="w-3 h-3 rounded-full bg-emerald-600 flex items-center justify-center text-white flex-shrink-0" style={{ fontSize: 7 }}>✓</span>
                                  : <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_CONFIG[l2.status].dotClass}`} />
                              )}
                              <button onClick={() => toggleL2Expand(l2.id)} className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-dm-soft dark:hover:text-dm-muted transition-colors p-0.5">
                                <ChevronIcon open={expanded} />
                              </button>
                              <button onClick={() => removeL2(l1.id, l2.id)} className="flex-shrink-0 text-xs text-red-300 hover:text-red-500 px-1 transition-colors">×</button>
                            </div>

                            {/* L2 expanded form */}
                            {expanded && (
                              <div className="px-3 pb-3 pt-2 space-y-2.5 border-t border-gray-100 dark:border-dm-border/60 bg-gray-50/50 dark:bg-dm-elevated/20">

                                {/* Assignee */}
                                <div>
                                  <p className="text-[10px] text-gray-400 dark:text-dm-soft mb-1">Assignee</p>
                                  <div className="flex items-center gap-2">
                                    {assignee && <UserAvatar user={assignee} color={assigneeColor} />}
                                    <select
                                      value={l2.assigneeId || ''}
                                      onChange={e => updateL2Field(l1.id, l2.id, 'assigneeId', e.target.value || null)}
                                      className={`flex-1 ${fieldInputCls}`}
                                    >
                                      <option value="">Unassigned</option>
                                      {selectedUsers.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                                    </select>
                                  </div>
                                </div>

                                {/* Status */}
                                <div>
                                  <p className="text-[10px] text-gray-400 dark:text-dm-soft mb-1">Status</p>
                                  <div className="flex gap-1 flex-wrap">
                                    {STATUSES.map(s => {
                                      const cfg = STATUS_CONFIG[s];
                                      const active = l2.status === s;
                                      return (
                                        <button
                                          key={s}
                                          onClick={() => updateL2Field(l1.id, l2.id, 'status', active ? null : s)}
                                          className={`px-2 py-1 rounded text-[10px] font-medium transition-all border ${
                                            active
                                              ? `${cfg.editorClass} border-transparent`
                                              : 'bg-white dark:bg-dm-elevated border-gray-200 dark:border-dm-border text-gray-400 dark:text-dm-soft hover:border-gray-300'
                                          }`}
                                        >
                                          {cfg.short}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Priority */}
                                <div>
                                  <p className="text-[10px] text-gray-400 dark:text-dm-soft mb-1">Priority</p>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4].map(p => {
                                      const cfg = PRIORITY_CONFIG[p];
                                      const active = l2.priority === p;
                                      return (
                                        <button
                                          key={p}
                                          onClick={() => updateL2Field(l1.id, l2.id, 'priority', active ? null : p)}
                                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${
                                            active ? `${cfg.class} border-transparent` : 'bg-white dark:bg-dm-elevated border-gray-200 dark:border-dm-border text-gray-400 dark:text-dm-soft hover:border-gray-300'
                                          }`}
                                        >
                                          {cfg.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Day */}
                                <div>
                                  <p className="text-[10px] text-gray-400 dark:text-dm-soft mb-1">Day</p>
                                  <input
                                    type="date"
                                    value={l2.day || ''}
                                    onChange={e => updateL2Field(l1.id, l2.id, 'day', e.target.value || null)}
                                    className={fieldInputCls}
                                  />
                                </div>

                                {/* Category */}
                                <div>
                                  <p className="text-[10px] text-gray-400 dark:text-dm-soft mb-1">Category</p>
                                  <select
                                    value={l2.category || ''}
                                    onChange={e => updateL2Field(l1.id, l2.id, 'category', e.target.value || null)}
                                    className={fieldInputCls}
                                  >
                                    <option value="">None</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                  {l2.category && (
                                    <span className={`inline-block mt-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${CATEGORY_STYLES[l2.category]}`}>
                                      {l2.category}
                                    </span>
                                  )}
                                </div>

                                {/* Note */}
                                <div>
                                  <p className="text-[10px] text-gray-400 dark:text-dm-soft mb-1">Note</p>
                                  <textarea
                                    value={l2.note || ''}
                                    onChange={e => updateL2Field(l1.id, l2.id, 'note', e.target.value || null)}
                                    rows={2}
                                    placeholder="Why this task exists..."
                                    className={`${fieldInputCls} resize-none`}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add L2 */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={newL2Labels[l1.id] || ''}
                          onChange={e => setNewL2Labels(prev => ({ ...prev, [l1.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && addL2(l1.id)}
                          placeholder="Work package..."
                          className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-dm-border bg-white dark:bg-dm-elevated text-xs text-dark-charcoal dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-forest-green/20 transition-shadow"
                        />
                        <button
                          onClick={() => addL2(l1.id)}
                          className="flex-shrink-0 px-3 py-1.5 text-xs bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950 transition-colors"
                        >
                          + L2
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add L1 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newL1Label}
                onChange={e => setNewL1Label(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addL1()}
                placeholder="Subproject name..."
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 dark:border-dm-border bg-gray-50 dark:bg-dm-elevated text-sm text-dark-charcoal dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-forest-green/30 transition-shadow"
              />
              <button
                onClick={addL1}
                className="flex-shrink-0 px-4 py-2 bg-gradient-action text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
              >
                + Add
              </button>
            </div>
          </>
        )}
      </div>

      {/* Summary counts */}
      {data.children.length > 0 && (
        <>
          <div className="h-px bg-gray-100 dark:bg-dm-border rounded-full" />
          <div className="text-xs text-gray-400 dark:text-dm-muted space-y-1">
            <p><span className="font-medium text-gray-600 dark:text-dm-soft">L1:</span> {data.children.length} subproject{data.children.length !== 1 ? 's' : ''}</p>
            <p><span className="font-medium text-gray-600 dark:text-dm-soft">L2:</span> {totalL2} work package{totalL2 !== 1 ? 's' : ''}</p>
          </div>
        </>
      )}

      <div className="h-px bg-gray-100 dark:bg-dm-border rounded-full" />

      {/* Board Info (collapsible, closed by default) */}
      <div className="space-y-4">
        <button
          onClick={() => setBoardInfoOpen(v => !v)}
          className="flex items-center gap-1.5 w-full text-left group"
        >
          <span className="text-xs font-semibold text-gray-500 dark:text-dm-muted">Board Info</span>
          <span className="ml-auto text-gray-400 dark:text-dm-soft group-hover:text-gray-600 dark:group-hover:text-dm-muted transition-colors">
            <ChevronIcon open={boardInfoOpen} />
          </span>
        </button>

        {boardInfoOpen && (
          <WBSBoardInfo
            boardMeta={boardMeta}
            onBoardMetaChange={onBoardMetaChange}
            allUsers={allUsers}
          />
        )}
      </div>
    </div>
  );
};
