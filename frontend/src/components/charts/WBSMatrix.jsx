import { useState } from 'react';
import { CATEGORY_STYLES, STATUS_CONFIG, PRIORITY_CONFIG } from './wbsConstants';

const formatDay = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
};

const ChevronIcon = ({ open }) => (
  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6l4 4 4-4" />
  </svg>
);

const StatusDot = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  if (cfg.done) {
    return (
      <span className="flex-shrink-0 w-3 h-3 rounded-full bg-emerald-600 flex items-center justify-center text-white leading-none" style={{ fontSize: 7 }}>
        ✓
      </span>
    );
  }
  return <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-px ${cfg.dotClass}`} />;
};

const MatrixCard = ({ l2, onNodeClick }) => {
  const isGate = l2.status === 'gate';
  const isDone = l2.status === 'done';

  return (
    <div
      onClick={() => onNodeClick?.(l2.id)}
      className={`group relative px-2 py-1.5 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${
        isGate
          ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 hover:border-red-300'
          : isDone
          ? 'bg-gray-50 dark:bg-dm-elevated/40 border-gray-100 dark:border-dm-border opacity-60 hover:opacity-80'
          : 'bg-white dark:bg-dm-elevated border-emerald-100 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-600'
      }`}
    >
      {/* Note tooltip */}
      {l2.note && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg max-w-[200px] text-center whitespace-normal opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
          {l2.note}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
      )}

      {/* Row 1: status dot + label + priority */}
      <div className="flex items-start gap-1.5">
        {l2.status && <StatusDot status={l2.status} />}
        <span className="flex-1 min-w-0 text-[11px] font-medium text-dark-charcoal dark:text-dm-text leading-snug line-clamp-2">{l2.label}</span>
        {l2.priority != null && PRIORITY_CONFIG[l2.priority] && (
          <span className={`flex-shrink-0 text-[9px] font-bold px-1 py-0.5 rounded leading-none ${PRIORITY_CONFIG[l2.priority].class}`}>
            {PRIORITY_CONFIG[l2.priority].label}
          </span>
        )}
      </div>

      {/* Row 2: category */}
      {l2.category && CATEGORY_STYLES[l2.category] && (
        <div className="mt-1">
          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full leading-none ${CATEGORY_STYLES[l2.category]}`}>
            {l2.category}
          </span>
        </div>
      )}
    </div>
  );
};

const groupDeliverablesByAssignee = (deliverables, enrichedMembers) => {
  const groups = new Map();
  (deliverables || []).forEach(d => {
    const key = d.assigneeId || '__unassigned__';
    if (!groups.has(key)) {
      const member = enrichedMembers.find(m => m.id === d.assigneeId);
      groups.set(key, {
        name: member?.name ?? 'Unassigned',
        profilePicture: member?.profilePicture ?? null,
        color: member?.color ?? '#6b7280',
        items: [],
      });
    }
    groups.get(key).items.push(d);
  });
  return Array.from(groups.values());
};

export const WBSMatrix = ({ activeBoard, enrichedMembers, onNodeClick }) => {
  const [openSections, setOpenSections] = useState({ gates: true, issues: true, deliverables: true });

  if (!activeBoard) return null;

  const allL2 = (activeBoard.wbsData?.children || []).flatMap(l1 => l1.children || []);
  const days = [...new Set(allL2.map(l => l.day).filter(Boolean))].sort();

  // Build cell lookup: memberId → day → [l2 nodes]
  const cellMap = {};
  for (const m of enrichedMembers) {
    cellMap[m.id] = {};
    for (const day of days) {
      cellMap[m.id][day] = allL2.filter(l => l.assigneeId === m.id && l.day === day);
    }
  }

  const hasGates = activeBoard.gates?.length > 0;
  const hasIssues = activeBoard.pinnedIssues?.length > 0;
  const hasDeliverables = activeBoard.deliverables?.length > 0;

  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const renderMetaSections = () => (
    <>
      {hasGates && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 overflow-hidden">
          <button
            onClick={() => toggleSection('gates')}
            className="w-full flex items-center justify-between px-5 py-3 bg-red-50 dark:bg-red-950/30 text-sm font-semibold text-red-700 dark:text-red-400"
          >
            <span>🚧 Gates ({activeBoard.gates.length})</span>
            <ChevronIcon open={openSections.gates} />
          </button>
          {openSections.gates && (
            <div className="divide-y divide-red-100 dark:divide-red-900/30">
              {activeBoard.gates.map((g, i) => (
                <div key={i} className="px-5 py-3 bg-red-50/40 dark:bg-red-950/10">
                  <p className="text-sm text-gray-800 dark:text-dm-text">{g.description}</p>
                  {g.unblocks && (
                    <p className="text-xs text-gray-400 dark:text-dm-muted mt-0.5">Unblocks: {g.unblocks}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {hasIssues && (
        <div className="rounded-xl border border-violet-200 dark:border-violet-900/40 overflow-hidden">
          <button
            onClick={() => toggleSection('issues')}
            className="w-full flex items-center justify-between px-5 py-3 bg-violet-50 dark:bg-violet-950/30 text-sm font-semibold text-violet-700 dark:text-violet-400"
          >
            <span>📌 Pinned Issues ({activeBoard.pinnedIssues.length})</span>
            <ChevronIcon open={openSections.issues} />
          </button>
          {openSections.issues && (
            <div className="divide-y divide-violet-100 dark:divide-violet-900/30">
              {activeBoard.pinnedIssues.map((issue, i) => (
                <div key={i} className="px-5 py-3 bg-violet-50/40 dark:bg-violet-950/10">
                  <p className="text-sm text-gray-800 dark:text-dm-text">{issue.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {hasDeliverables && (
        <div className="rounded-xl border border-teal-200 dark:border-teal-900/40 overflow-hidden">
          <button
            onClick={() => toggleSection('deliverables')}
            className="w-full flex items-center justify-between px-5 py-3 bg-teal-50 dark:bg-teal-950/30 text-sm font-semibold text-teal-700 dark:text-teal-400"
          >
            <span>🎯 Deliverables ({activeBoard.deliverables.length})</span>
            <ChevronIcon open={openSections.deliverables} />
          </button>
          {openSections.deliverables && (
            <div className="divide-y divide-teal-100 dark:divide-teal-900/30">
              {groupDeliverablesByAssignee(activeBoard.deliverables, enrichedMembers).map((group, i) => (
                <div key={i} className="px-5 py-3 bg-teal-50/30 dark:bg-teal-950/10">
                  <p className="text-xs font-semibold text-gray-700 dark:text-dm-text mb-1.5">{group.name}</p>
                  <ul className="space-y-1">
                    {group.items.map((d, j) => (
                      <li key={j} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-dm-muted">
                        <span className="text-teal-400 mt-0.5 flex-shrink-0">•</span>
                        {d.description}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );

  // Empty state when no members or no days
  if (enrichedMembers.length === 0 || days.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-dm-card rounded-[24px] shadow-card-soft dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] p-12 flex flex-col items-center justify-center gap-3 text-center min-h-[220px]">
          <p className="text-gray-400 dark:text-dm-muted text-sm max-w-sm">
            {enrichedMembers.length === 0
              ? 'Add team members in the editor panel to see the person × day matrix.'
              : 'No work packages have a scheduled day yet. Set a day on work packages in the editor to populate this view.'}
          </p>
        </div>
        {renderMetaSections()}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Matrix grid */}
      <div className="bg-white dark:bg-dm-card rounded-[24px] shadow-card-soft dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="w-44 min-w-[11rem] px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-dm-muted border-b border-gray-100 dark:border-dm-border bg-gray-50 dark:bg-dm-elevated/60 sticky left-0 z-10">
                  Member
                </th>
                {days.map(day => (
                  <th key={day} className="min-w-[192px] px-3 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-dm-muted border-b border-l border-gray-100 dark:border-dm-border bg-gray-50 dark:bg-dm-elevated/60 whitespace-nowrap">
                    {formatDay(day)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enrichedMembers.map((member) => (
                <tr key={member.id} className="group/row">
                  {/* Member name cell — sticky */}
                  <td className="w-44 min-w-[11rem] px-4 py-3 align-top border-b border-gray-100 dark:border-dm-border bg-white dark:bg-dm-card sticky left-0 z-10 group-hover/row:bg-gray-50/60 dark:group-hover/row:bg-dm-elevated/20 transition-colors">
                    <div className="flex items-center gap-2">
                      {member.profilePicture ? (
                        <img
                          src={member.profilePicture}
                          alt={member.name}
                          className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-1 ring-gray-200 dark:ring-dm-border"
                        />
                      ) : (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-medium text-gray-700 dark:text-dm-text truncate">{member.name}</span>
                    </div>
                  </td>

                  {/* Day cells */}
                  {days.map(day => {
                    const cards = cellMap[member.id]?.[day] ?? [];
                    return (
                      <td
                        key={day}
                        className="min-w-[192px] px-3 py-3 align-top border-b border-l border-gray-100 dark:border-dm-border group-hover/row:bg-gray-50/30 dark:group-hover/row:bg-dm-elevated/10 transition-colors"
                      >
                        {cards.length > 0 ? (
                          <div className="space-y-1.5">
                            {cards.map(l2 => (
                              <MatrixCard key={l2.id} l2={l2} onNodeClick={onNodeClick} />
                            ))}
                          </div>
                        ) : (
                          <div className="h-9 rounded-lg border border-dashed border-gray-200 dark:border-dm-border/40 flex items-center justify-center">
                            <span className="text-[10px] text-gray-300 dark:text-dm-soft/30 select-none">—</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Board metadata sections (read-only) */}
      {renderMetaSections()}
    </div>
  );
};
