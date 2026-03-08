import { useState } from 'react';
import { useBoard, useBoards, useCalendarTickets, useKanbanMutations } from '../../hooks/useKanban';
import { BoardView } from './BoardView';
import { CalendarView } from './CalendarView';
import { TicketModal } from './TicketModal';

// Board background gradients — one per board index (cycles)
const BOARD_GRADIENTS = [
  'linear-gradient(135deg, #1565c0 0%, #283593 100%)',
  'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
  'linear-gradient(135deg, #b71c1c 0%, #880e4f 100%)',
  'linear-gradient(135deg, #e65100 0%, #bf360c 100%)',
  'linear-gradient(135deg, #4a148c 0%, #1a237e 100%)',
  'linear-gradient(135deg, #006064 0%, #004d40 100%)',
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

        {/* View tabs — Board | Calendar */}
        {activeBoardId && (
          <div className="flex items-center gap-1 bg-black/20 rounded p-0.5 flex-shrink-0">
            <button
              onClick={() => setActiveTab('board')}
              className={`px-3 py-1 text-[13px] font-medium rounded transition-colors ${
                activeTab === 'board' ? 'bg-white/25 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="11" rx="1"/>
                </svg>
                Board
              </span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1 text-[13px] font-medium rounded transition-colors ${
                activeTab === 'calendar' ? 'bg-white/25 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Calendar
              </span>
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
            <button type="submit" className="px-3 py-1.5 bg-[#0052cc] text-white rounded text-sm font-medium hover:bg-[#0065ff] flex-shrink-0">Create</button>
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
              <BoardView
                board={board}
                columns={columns}
                boardId={activeBoardId}
                mutations={mutations}
                onTicketOpen={setSelectedTicketId}
              />
            )}
            {activeTab === 'calendar' && (
              <CalendarView
                tickets={allCalTickets}
                boardId={activeBoardId}
                onTicketClick={setSelectedTicketId}
              />
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
