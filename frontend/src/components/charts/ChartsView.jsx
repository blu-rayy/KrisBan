import { useCallback, useEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { HierarchySquare01Icon, TaskDaily01Icon } from '@hugeicons/core-free-icons';
import { WBSChart } from './WBSChart';
import { WBSEditor } from './WBSEditor';
import { WBSMatrix } from './WBSMatrix';
import { WBSImportModal } from './WBSImportModal';
import { wbsService, authService, kanbanService } from '../../services/api';

const MEMBER_COLORS = [
  '#15803d', '#2563eb', '#7c3aed', '#dc2626',
  '#d97706', '#0891b2', '#be185d', '#65a30d',
];

let boardCounter = 1;
const genBoardId = () => `board-${Date.now()}-${boardCounter++}`;

const makeInitialBoard = (weekNum) => ({
  id: genBoardId(),
  name: `Week ${weekNum}`,
  wbsData: { id: 'root', label: 'My Project', children: [] },
});

const DEFAULT_STATE = () => {
  const board = makeInitialBoard(1);
  return { boards: [board], activeBoardId: board.id, teamMembers: [] };
};

// Normalise legacy teamMembers (array of objects) → array of id strings
const normaliseMemberIds = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.map(m => (typeof m === 'string' ? m : m.id));
};

const ChevronIcon = ({ open }) => (
  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6l4 4 4-4" />
  </svg>
);

const groupDeliverablesByAssignee = (deliverables, allUsers) => {
  const groups = new Map();
  deliverables.forEach(d => {
    const key = d.assigneeId || '__unassigned__';
    if (!groups.has(key)) {
      const user = allUsers.find(u => u.id === d.assigneeId);
      groups.set(key, { name: user?.fullName ?? 'Unassigned', profilePicture: user?.profilePicture ?? null, items: [] });
    }
    groups.get(key).items.push(d);
  });
  return Array.from(groups.values());
};

export const ChartsView = ({ onNavigateToKanban }) => {
  const [activeTab, setActiveTab] = useState('wbs');
  const [editorOpen, setEditorOpen] = useState(true);
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({ gates: true, issues: true, deliverables: true });
  const [importOpen, setImportOpen] = useState(false);

  const saveTimer = useRef(null);

  useEffect(() => {
    Promise.all([
      authService.getUsers().then(r => r.data?.data ?? []).catch(() => []),
      wbsService.get().then(r => r.data?.data ?? null).catch(() => null),
    ]).then(([users, row]) => {
      setAllUsers(users);
      if (row && Array.isArray(row.boards) && row.boards.length > 0) {
        setBoards(row.boards);
        setActiveBoardId(row.active_board_id ?? row.boards[0].id);
        setSelectedMemberIds(normaliseMemberIds(row.team_members));
      } else {
        const def = DEFAULT_STATE();
        setBoards(def.boards);
        setActiveBoardId(def.activeBoardId);
        setSelectedMemberIds([]);
      }
    }).finally(() => setLoading(false));
  }, []);

  const reloadAfterImport = useCallback((newBoardId) => {
    setImportOpen(false);
    wbsService.get().then(r => {
      const row = r.data?.data;
      if (row && Array.isArray(row.boards) && row.boards.length > 0) {
        setBoards(row.boards);
        setActiveBoardId(newBoardId ?? row.active_board_id ?? row.boards[0].id);
        setSelectedMemberIds(normaliseMemberIds(row.team_members));
      }
    }).catch(() => {});
  }, []);

  // Fire-and-forget: sync a newly added L2 node to the shared kanban board
  const handleL2Add = useCallback((l2Node) => {
    if (!l2Node?.id || !l2Node?.label) return;
    kanbanService.wbsSync({
      wbsNodeId:     l2Node.id,
      title:         l2Node.label,
      assigneeUserId: l2Node.assigneeId || null,
      dueDate:       l2Node.day || null,
      description:   l2Node.note || null,
    }).catch(() => {});
  }, []);

  const scheduleSave = useCallback((nextBoards, nextMemberIds, nextActiveBoardId) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      wbsService.save({ boards: nextBoards, teamMembers: nextMemberIds, activeBoardId: nextActiveBoardId });
    }, 800);
  }, []);

  const updateBoards = (next) => {
    setBoards(next);
    scheduleSave(next, selectedMemberIds, activeBoardId);
  };

  const handleMemberToggle = (userId) => {
    setSelectedMemberIds(prev => {
      const next = prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId];
      scheduleSave(boards, next, activeBoardId);
      return next;
    });
  };

  const switchBoard = (id) => {
    setActiveBoardId(id);
    scheduleSave(boards, selectedMemberIds, id);
  };

  const activeBoard = boards.find(b => b.id === activeBoardId) ?? boards[0];

  const handleWbsChange = (newData) => {
    const next = boards.map(b => b.id === activeBoard?.id ? { ...b, wbsData: newData } : b);
    updateBoards(next);
  };

  const handleBoardMetaChange = (meta) => {
    const next = boards.map(b => b.id === activeBoard?.id ? { ...b, ...meta } : b);
    updateBoards(next);
  };

  const addWeek = () => {
    const board = makeInitialBoard(boards.length + 1);
    const next = [...boards, board];
    setBoards(next);
    setActiveBoardId(board.id);
    scheduleSave(next, selectedMemberIds, board.id);
  };

  const removeWeek = (boardId) => {
    if (boards.length === 1) return;
    const remaining = boards.filter(b => b.id !== boardId);
    const nextActive = activeBoardId === boardId ? remaining[0].id : activeBoardId;
    setBoards(remaining);
    setActiveBoardId(nextActive);
    scheduleSave(remaining, selectedMemberIds, nextActive);
  };

  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const enrichedMembers = selectedMemberIds.map((id, idx) => {
    const user = allUsers.find(u => u.id === id);
    return { id, name: user?.fullName ?? id, profilePicture: user?.profilePicture ?? null, color: MEMBER_COLORS[idx % MEMBER_COLORS.length] };
  });

  const boardMeta = activeBoard
    ? { name: activeBoard.name, summary: activeBoard.summary, carryForward: activeBoard.carryForward, gates: activeBoard.gates, pinnedIssues: activeBoard.pinnedIssues, deliverables: activeBoard.deliverables }
    : {};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-forest-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasSummary = !!activeBoard?.summary;
  const hasCarryForward = !!activeBoard?.carryForward;
  const hasGates = activeBoard?.gates?.length > 0;
  const hasIssues = activeBoard?.pinnedIssues?.length > 0;
  const hasDeliverables = activeBoard?.deliverables?.length > 0;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 dark:bg-dm-ground min-h-full">

      {/* Page heading */}
      <div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-charcoal dark:text-dm-text">
          Work Breakdown Structure
        </h2>
        <p className="text-gray-600 dark:text-dm-muted text-sm sm:text-base italic">
          Decompose your project into subprojects and work packages
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-dm-border">
        <button
          onClick={() => setActiveTab('wbs')}
          className={`px-6 py-3 font-medium border-b-2 transition-all duration-300 ${
            activeTab === 'wbs'
              ? 'border-forest-green text-forest-green'
              : 'border-transparent text-gray-600 dark:text-dm-muted hover:text-dark-charcoal dark:hover:text-dm-text'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <HugeiconsIcon icon={HierarchySquare01Icon} size={18} color="currentColor" />
            <span>WBS</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-6 py-3 font-medium border-b-2 transition-all duration-300 ${
            activeTab === 'matrix'
              ? 'border-forest-green text-forest-green'
              : 'border-transparent text-gray-600 dark:text-dm-muted hover:text-dark-charcoal dark:hover:text-dm-text'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="1" width="16" height="16" rx="2" />
              <line x1="1" y1="6" x2="17" y2="6" />
              <line x1="1" y1="11" x2="17" y2="11" />
              <line x1="6" y1="1" x2="6" y2="17" />
            </svg>
            <span>Matrix</span>
          </span>
        </button>

        <button disabled className="px-6 py-3 font-medium border-b-2 border-transparent text-gray-400 dark:text-dm-soft cursor-not-allowed">
          <span className="inline-flex items-center gap-2">
            <HugeiconsIcon icon={TaskDaily01Icon} size={18} color="currentColor" />
            <span>Gantt</span>
            <span className="text-xs bg-gray-200 dark:bg-dm-border text-gray-500 dark:text-dm-muted px-2 py-0.5 rounded-full">Soon</span>
          </span>
        </button>
      </div>

      {/* Week selector + editor toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        {boards.map(board => (
          <div key={board.id} className="relative group/week">
            <button
              onClick={() => switchBoard(board.id)}
              className={`pl-4 pr-7 py-1.5 text-sm rounded-full border transition-colors ${
                activeBoardId === board.id
                  ? 'bg-forest-green text-white border-forest-green shadow-sm'
                  : 'border-gray-200 dark:border-dm-border text-gray-600 dark:text-dm-muted hover:border-forest-green hover:text-forest-green dark:hover:text-emerald-400'
              }`}
            >
              {board.name}
            </button>
            {boards.length > 1 && (
              <button
                onClick={() => removeWeek(board.id)}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[10px] leading-none transition-opacity opacity-0 group-hover/week:opacity-100 ${
                  activeBoardId === board.id ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-red-500'
                }`}
                aria-label={`Remove ${board.name}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addWeek}
          className="px-4 py-1.5 text-sm rounded-full border border-dashed border-gray-300 dark:border-dm-border text-gray-400 dark:text-dm-muted hover:border-forest-green hover:text-forest-green dark:hover:text-emerald-400 transition-colors"
        >
          + Add Week
        </button>

        {/* Import button */}
        <button
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-dm-border text-gray-500 dark:text-dm-muted hover:border-forest-green hover:text-forest-green dark:hover:text-emerald-400 transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M2 10v4h12v-4M8 2v8M5 7l3 3 3-3"/>
          </svg>
          Import
        </button>

        {/* Editor toggle */}
        <button
          onClick={() => setEditorOpen(v => !v)}
          title={editorOpen ? 'Hide editor' : 'Show editor'}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors ${
            editorOpen
              ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
              : 'border-gray-200 dark:border-dm-border text-gray-500 dark:text-dm-muted hover:border-forest-green hover:text-forest-green dark:hover:text-emerald-400'
          }`}
        >
          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${editorOpen ? '' : 'rotate-180'}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 4l-4 4 4 4" />
          </svg>
          Editor
        </button>
      </div>

      {/* Main content grid */}
      <div className={`grid gap-6 items-start transition-all duration-300 ${editorOpen ? 'lg:grid-cols-[1fr_320px]' : 'grid-cols-1'}`}>

        {/* Left column: context bars + chart + board sections */}
        <div className="space-y-4">

          {/* Summary / Carry Forward bars */}
          {(hasSummary || hasCarryForward) && (
            <div className="space-y-2">
              {hasSummary && (
                <div className="px-5 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Summary</p>
                  <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">{activeBoard.summary}</p>
                </div>
              )}
              {hasCarryForward && (
                <div className="px-5 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">↩ Carry Forward</p>
                  <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{activeBoard.carryForward}</p>
                </div>
              )}
            </div>
          )}

          {/* WBS chart card (tree view) */}
          {activeTab === 'wbs' && (
            <div className="bg-white dark:bg-dm-card rounded-[24px] shadow-card-soft dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] overflow-hidden min-h-[320px]">
              {activeBoard && <WBSChart data={activeBoard.wbsData} teamMembers={enrichedMembers} />}
            </div>
          )}

          {/* Matrix view */}
          {activeTab === 'matrix' && activeBoard && (
            <WBSMatrix
              activeBoard={activeBoard}
              enrichedMembers={enrichedMembers}
              onNodeClick={(wbsNodeId) => onNavigateToKanban?.(wbsNodeId)}
            />
          )}

          {/* Gates, Pinned Issues, Deliverables — only shown in WBS tree tab; Matrix renders them inline */}
          {activeTab === 'wbs' && hasGates && (
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

          {/* Pinned Issues */}
          {activeTab === 'wbs' && hasIssues && (
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

          {/* Deliverables */}
          {activeTab === 'wbs' && hasDeliverables && (
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
                  {groupDeliverablesByAssignee(activeBoard.deliverables, allUsers).map((group, i) => (
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
        </div>

        {/* Right column: editor */}
        {editorOpen && activeBoard && (
          <WBSEditor
            data={activeBoard.wbsData}
            onChange={handleWbsChange}
            selectedMemberIds={selectedMemberIds}
            onMemberToggle={handleMemberToggle}
            allUsers={allUsers}
            memberColors={MEMBER_COLORS}
            boardMeta={boardMeta}
            onBoardMetaChange={handleBoardMetaChange}
            onL2Add={handleL2Add}
          />
        )}
      </div>

      {/* Import modal */}
      {importOpen && (
        <WBSImportModal
          onClose={() => setImportOpen(false)}
          onSuccess={reloadAfterImport}
        />
      )}
    </div>
  );
};
