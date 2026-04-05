import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { HierarchySquare01Icon, TaskDaily01Icon } from '@hugeicons/core-free-icons';
import { WBSChart } from './WBSChart';
import { WBSDebugPanel } from './WBSDebugPanel';

const STORAGE_KEY = 'krisban-wbs-v1';

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

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
};

const PAGE_HEADINGS = {
  wbs: {
    title: 'Work Breakdown Structure',
    description: 'Decompose your project into subprojects and work packages',
  },
  gantt: {
    title: 'Gantt Chart',
    description: 'Visualize your project schedule and timeline',
  },
};

export const ChartsView = () => {
  const saved = loadFromStorage();

  const [activeTab, setActiveTab] = useState('wbs');
  const [showDebug, setShowDebug] = useState(true);
  const [boards, setBoards] = useState(saved?.boards ?? [makeInitialBoard(1)]);
  const [activeBoardId, setActiveBoardId] = useState(saved?.activeBoardId ?? boards[0]?.id);
  const [teamMembers, setTeamMembers] = useState(saved?.teamMembers ?? []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ boards, activeBoardId, teamMembers }));
  }, [boards, activeBoardId, teamMembers]);

  const activeBoard = boards.find(b => b.id === activeBoardId) ?? boards[0];
  const heading = PAGE_HEADINGS[activeTab] ?? PAGE_HEADINGS.wbs;

  const handleWbsChange = (newData) => {
    setBoards(prev =>
      prev.map(b => b.id === activeBoard.id ? { ...b, wbsData: newData } : b)
    );
  };

  const addWeek = () => {
    const next = boards.length + 1;
    const board = makeInitialBoard(next);
    setBoards(prev => [...prev, board]);
    setActiveBoardId(board.id);
  };

  const removeWeek = (boardId) => {
    if (boards.length === 1) return;
    const remaining = boards.filter(b => b.id !== boardId);
    setBoards(remaining);
    if (activeBoardId === boardId) setActiveBoardId(remaining[0].id);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 dark:bg-dm-ground min-h-full">

      {/* Page heading + actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-charcoal dark:text-dm-text">
            {heading.title}
          </h2>
          <p className="text-gray-600 dark:text-dm-muted text-sm sm:text-base italic">
            {heading.description}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => {}}
            className="px-4 py-2 border border-gray-200 dark:border-dm-border text-gray-600 dark:text-dm-muted text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-dm-elevated transition-colors"
          >
            Import
          </button>
          <button
            onClick={() => setShowDebug(v => !v)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              showDebug
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'border-gray-200 dark:border-dm-border text-gray-600 dark:text-dm-muted hover:bg-gray-50 dark:hover:bg-dm-elevated'
            }`}
          >
            {showDebug ? 'Hide Debug' : 'Debug'}
          </button>
        </div>
      </div>

      {/* Tab bar — matches Progress Reports style */}
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
          disabled
          className="px-6 py-3 font-medium border-b-2 border-transparent text-gray-400 dark:text-dm-soft cursor-not-allowed"
        >
          <span className="inline-flex items-center gap-2">
            <HugeiconsIcon icon={TaskDaily01Icon} size={18} color="currentColor" />
            <span>Gantt</span>
            <span className="text-xs bg-gray-200 dark:bg-dm-border text-gray-500 dark:text-dm-muted px-2 py-0.5 rounded-full">
              Soon
            </span>
          </span>
        </button>
      </div>

      {/* Week selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {boards.map(board => (
          <div key={board.id} className="relative group/week">
            <button
              onClick={() => setActiveBoardId(board.id)}
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
                  activeBoardId === board.id
                    ? 'text-white/70 hover:text-white'
                    : 'text-gray-400 hover:text-red-500'
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
      </div>

      {/* Content */}
      <div
        className={`grid gap-6 items-start ${
          showDebug ? 'lg:grid-cols-[1fr_320px]' : 'grid-cols-1'
        }`}
      >
        <div className="bg-white dark:bg-dm-card rounded-[24px] shadow-card-soft dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] overflow-hidden min-h-[320px]">
          {activeTab === 'wbs' && (
            <WBSChart data={activeBoard.wbsData} teamMembers={teamMembers} />
          )}
        </div>

        {showDebug && (
          <WBSDebugPanel
            data={activeBoard.wbsData}
            onChange={handleWbsChange}
            teamMembers={teamMembers}
            onTeamChange={setTeamMembers}
            memberColors={MEMBER_COLORS}
          />
        )}
      </div>
    </div>
  );
};
