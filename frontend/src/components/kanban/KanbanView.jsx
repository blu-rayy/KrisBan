import { useState } from 'react';
// import { AnimatePresence, motion } from 'framer-motion';
import { TicketsListView } from './TicketsListView';
import { useBoard, useBoards, useCalendarTickets, useKanbanMutations } from '../../hooks/useKanban';
import { BoardView } from './BoardView';
import { CalendarView } from './CalendarView';
import { TicketModal } from './TicketModal';

// Board background gradients — forest green palette (cycles per board)
const BOARD_GRADIENTS = [
  'linear-gradient(135deg, #15803d 0%, #064e3b 100%)',
  'linear-gradient(135deg, #047857 0%, #022c22 100%)',
  'linear-gradient(135deg, #065f46 0%, #064e3b 100%)',
  'linear-gradient(135deg, #10b981 0%, #047857 100%)',
  'linear-gradient(135deg, #022c22 0%, #000000 100%)',
  'linear-gradient(135deg, #064e3b 0%, #1a3a2a 100%)',
];

export const KanbanView = () => {
  const { data: boards = [], isLoading: loadingBoards } = useBoards();
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [activeTab,        setActiveTab]        = useState('board');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);
  const [newBoardName,     setNewBoardName]     = useState('');
  const [newBoardDesc,     setNewBoardDesc]     = useState('');

  const activeBoardId = selectedBoardId || boards[0]?.id || null;
  const activeBoardIdx = boards.findIndex((b) => b.id === activeBoardId);
  const bgGradient = BOARD_GRADIENTS[Math.max(activeBoardIdx, 0) % BOARD_GRADIENTS.length];

  const { data: boardData, isLoading: loadingBoard, isError: boardError } = useBoard(activeBoardId);
  const now = new Date();
  const allCalTickets = useCalendarTickets(activeBoardId, now.getFullYear(), now.getMonth() + 1).data || [];
  const mutations = useKanbanMutations(activeBoardId);

  if (!loadingBoards && boards.length > 0 && !selectedBoardId) {
    setSelectedBoardId(boards[0].id);
  }

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    const res = await mutations.createBoard.mutateAsync({ name: newBoardName.trim(), description: newBoardDesc.trim() });
    const newId = res?.data?.data?.id;
    setNewBoardName(''); setNewBoardDesc(''); setShowNewBoardForm(false);
    if (newId) setSelectedBoardId(newId);
  };

  if (loadingBoards) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: BOARD_GRADIENTS[0] }}>
        <div className="text-white/60 text-sm">Loading boards…</div>
      </div>
    );
  }

  const { board, columns = [] } = boardData || {};
  const activeBoard = boards.find((b) => b.id === activeBoardId);

  return (
    <div className="flex flex-col h-full" style={{ background: bgGradient }}>

      {/* ── Header bar (overlaid on gradient) ───────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2 flex-wrap" style={{ background: 'rgba(0,0,0,0.18)' }}>
        {/* Board name */}
        {activeBoard && (
          <span className="text-white font-bold text-[15px] mr-2 whitespace-nowrap">{activeBoard.name}</span>
        )}

        {/* Divider */}
        {activeBoard && <div className="w-px h-5 bg-white/30 flex-shrink-0" />}

        {/* Board switcher */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBoardId(b.id)}
              className={`flex-shrink-0 px-3 py-1 rounded text-[13px] font-medium transition-colors ${
                b.id === activeBoardId
                  ? 'bg-white/30 text-white'
                  : 'text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >{b.name}</button>
          ))}
          <button
            onClick={() => setShowNewBoardForm((v) => !v)}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded text-[13px] text-white/60 hover:bg-white/20 hover:text-white transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New board
          </button>
        </div>

        {/* View tabs — Board | Calendar | List */}
        {activeBoardId && (
          <div className="flex items-center gap-2 flex-shrink-0 bg-black/20 rounded-full px-2 py-1">
            {/* Board Tab */}
            <button
              onClick={() => setActiveTab('board')}
              className={`transition-all duration-200 px-5 py-2 rounded-full font-semibold flex items-center gap-2 text-sm shadow-sm focus:outline-none
                ${activeTab === 'board'
                  ? 'bg-white/25 text-white scale-105'
                  : 'bg-transparent text-white/60 hover:bg-white/10 hover:text-white scale-100'}
              `}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="11" rx="1"/>
              </svg>
              Board
            </button>
            {/* List Tab */}
            <button
              onClick={() => setActiveTab('list')}
              className={`transition-all duration-200 px-5 py-2 rounded-full font-semibold flex items-center gap-2 text-sm shadow-sm focus:outline-none
                ${activeTab === 'list'
                  ? 'bg-white/25 text-white scale-105'
                  : 'bg-transparent text-white/60 hover:bg-white/10 hover:text-white scale-100'}
              `}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="4" y="5" width="16" height="2" rx="1"/><rect x="4" y="11" width="16" height="2" rx="1"/><rect x="4" y="17" width="16" height="2" rx="1"/>
              </svg>
              List
            </button>
            {/* Calendar Tab */}
            <button
              onClick={() => setActiveTab('calendar')}
              className={`transition-all duration-200 px-5 py-2 rounded-full font-semibold flex items-center gap-2 text-sm shadow-sm focus:outline-none
                ${activeTab === 'calendar'
                  ? 'bg-white/25 text-white scale-105'
                  : 'bg-transparent text-white/60 hover:bg-white/10 hover:text-white scale-100'}
              `}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Calendar
            </button>
          </div>
        )}
      </div>

      {/* ── New board form ───────────────────────────────────────────────────── */}
      {showNewBoardForm && (
        <div className="px-4 py-3" style={{ background: 'rgba(0,0,0,0.25)' }}>
          <form onSubmit={handleCreateBoard} className="flex gap-2 items-center max-w-md">
            <input
              autoFocus
              className="flex-1 px-3 py-1.5 bg-white/90 text-[#172b4d] rounded text-sm placeholder-gray-400 focus:outline-none focus:bg-white"
              placeholder="Board name"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
            />
            <input
              className="flex-1 px-3 py-1.5 bg-white/90 text-[#172b4d] rounded text-sm placeholder-gray-400 focus:outline-none focus:bg-white"
              placeholder="Description (optional)"
              value={newBoardDesc}
              onChange={(e) => setNewBoardDesc(e.target.value)}
            />
            <button type="submit" className="px-3 py-1.5 bg-[#15803d] text-white rounded text-sm font-medium hover:bg-[#16a34a] flex-shrink-0">Create</button>
            <button type="button" onClick={() => setShowNewBoardForm(false)} className="px-3 py-1.5 text-white/70 hover:text-white text-sm flex-shrink-0">Cancel</button>
          </form>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-3 pt-3">
        {boards.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="11" rx="1"/>
            </svg>
            <p className="text-white/60 text-sm">No boards yet. Create one to get started.</p>
            <button
              onClick={() => setShowNewBoardForm(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded text-sm font-medium transition-colors"
            >Create board</button>
          </div>
        )}

        {activeBoardId && loadingBoard && (
          <div className="flex items-center justify-center h-64">
            <div className="text-white/60 text-sm">Loading board…</div>
          </div>
        )}

        {activeBoardId && boardError && (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-200 text-sm">Failed to load board. Please try again.</div>
          </div>
        )}

        {activeBoardId && !loadingBoard && !boardError && board && (
          <>
            {activeTab === 'board' && (
              <div className="h-full">
                <BoardView
                  board={board}
                  columns={columns}
                  boardId={activeBoardId}
                  mutations={mutations}
                  onTicketOpen={setSelectedTicketId}
                />
              </div>
            )}
            {activeTab === 'calendar' && (
              <div className="h-full">
                <CalendarView
                  tickets={allCalTickets}
                  boardId={activeBoardId}
                  onTicketClick={setSelectedTicketId}
                />
              </div>
            )}
            {activeTab === 'list' && (
              <div className="h-full bg-white dark:bg-dm-card rounded-2xl overflow-hidden">
                <TicketsListView />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Ticket modal ─────────────────────────────────────────────────────── */}
      {selectedTicketId && (
        <TicketModal
          ticketId={selectedTicketId}
          boardId={activeBoardId}
          onClose={() => setSelectedTicketId(null)}
        />
      )}
    </div>
  );
};
