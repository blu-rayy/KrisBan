import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { KanbanIcon } from '@hugeicons/core-free-icons';
import { useBoard, useBoards, useCalendarTickets, useKanbanMutations } from '../../hooks/useKanban';
import { BoardView } from './BoardView';
import { CalendarView } from './CalendarView';
import { TicketModal } from './TicketModal';

const TAB_CLS     = 'px-4 py-2 text-sm font-medium rounded-xl transition-colors';
const TAB_ACTIVE  = `${TAB_CLS} bg-white shadow-sm text-blue-600`;
const TAB_IDLE    = `${TAB_CLS} text-gray-500 hover:text-gray-700`;

export const KanbanView = () => {
  const { data: boards = [], isLoading: loadingBoards } = useBoards();
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [activeTab,  setActiveTab]  = useState('board');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');

  // Resolve active board id (first board if nothing selected)
  const activeBoardId = selectedBoardId || boards[0]?.id || null;

  const { data: boardData, isLoading: loadingBoard, isError: boardError } = useBoard(activeBoardId);
  const { data: calTickets = [] } = useCalendarTickets(activeBoardId, new Date().getFullYear(), new Date().getMonth() + 1);

  const now = new Date();
  const allCalTickets = useCalendarTickets(activeBoardId, now.getFullYear(), now.getMonth() + 1).data || [];

  const mutations = useKanbanMutations(activeBoardId);

  // Auto-select first board when boards load
  if (!loadingBoards && boards.length > 0 && !selectedBoardId) {
    setSelectedBoardId(boards[0].id);
  }

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    const res = await mutations.createBoard.mutateAsync({ name: newBoardName.trim(), description: newBoardDesc.trim() });
    const newId = res?.data?.data?.id;
    setNewBoardName('');
    setNewBoardDesc('');
    setShowNewBoardForm(false);
    if (newId) setSelectedBoardId(newId);
  };

  // ── Render states ───────────────────────────────────────────────────────────

  if (loadingBoards) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-gray-400 text-sm">Loading boards…</div>
      </div>
    );
  }

  const { board, columns = [] } = boardData || {};

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4 flex-wrap">
        {/* Board tabs */}
        <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide">
          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBoardId(b.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                b.id === activeBoardId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {b.name}
            </button>
          ))}
          <button
            onClick={() => setShowNewBoardForm((v) => !v)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >+ New board</button>
        </div>

        {/* View tabs */}
        {activeBoardId && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('board')}
              className={activeTab === 'board' ? TAB_ACTIVE : TAB_IDLE}
            >Board</button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={activeTab === 'calendar' ? TAB_ACTIVE : TAB_IDLE}
            >Calendar</button>
          </div>
        )}
      </div>

      {/* New board form */}
      {showNewBoardForm && (
        <div className="bg-white border-b border-gray-100 px-6 py-3">
          <form onSubmit={handleCreateBoard} className="flex gap-3 items-end max-w-lg">
            <div className="flex-1 space-y-1">
              <input
                autoFocus
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Board name"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
              />
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Description (optional)"
                value={newBoardDesc}
                onChange={(e) => setNewBoardDesc(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">Create</button>
              <button type="button" onClick={() => setShowNewBoardForm(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6">
        {/* Empty state */}
        {boards.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <HugeiconsIcon icon={KanbanIcon} size={48} color="#D1D5DB" />
            <p className="text-gray-400 text-sm">No boards yet. Create one to get started.</p>
            <button
              onClick={() => setShowNewBoardForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
            >Create board</button>
          </div>
        )}

        {activeBoardId && loadingBoard && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400 text-sm">Loading board…</div>
          </div>
        )}

        {activeBoardId && boardError && (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400 text-sm">Failed to load board. Please try again.</div>
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
