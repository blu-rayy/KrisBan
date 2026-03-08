import { useState } from 'react';
import { format, isPast, isToday } from 'date-fns';
import { useBoards, useBoard, useKanbanMutations } from '../../hooks/useKanban';
import { TicketModal } from './TicketModal';
import { getInitials } from './TicketCard';

const STATUS_MAP = {};

export const TicketsListView = () => {
  const { data: boards = [], isLoading: loadingBoards } = useBoards();
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [search, setSearch] = useState('');

  const activeBoardId = selectedBoardId || boards[0]?.id || null;
  const { data: boardData, isLoading } = useBoard(activeBoardId);
  const mutations = useKanbanMutations(activeBoardId);

  if (!loadingBoards && boards.length > 0 && !selectedBoardId) {
    setSelectedBoardId(boards[0].id);
  }

  const { columns = [] } = boardData || {};

  // Flatten all tickets with their column name
  const allTickets = columns.flatMap((col) =>
    (col.tickets || []).map((t) => ({ ...t, columnName: col.name, columnColor: col.color }))
  );

  const filtered = allTickets.filter((t) =>
    !search || t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4 flex-wrap">
        {/* Board selector */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
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
        </div>

        {/* Search */}
        <input
          className="ml-auto w-56 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="Search tickets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        {(loadingBoards || isLoading) && (
          <div className="text-center text-gray-400 py-16">Loading…</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center text-gray-400 py-16">
            {search ? 'No tickets match your search.' : 'No tickets in this board yet.'}
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Assignees</th>
                  <th className="text-left px-4 py-3">Labels</th>
                  <th className="text-left px-4 py-3">Due</th>
                  <th className="text-left px-4 py-3">Checklist</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => {
                  const dueDate = ticket.due_date ? new Date(`${ticket.due_date}T00:00:00`) : null;
                  const overdue  = dueDate && isPast(dueDate) && !isToday(dueDate);
                  const dueToday = dueDate && isToday(dueDate);
                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className="border-b border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      {/* Title */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {ticket.cover_color && (
                            <span className="w-1.5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: ticket.cover_color }} />
                          )}
                          <span className="font-medium text-gray-800">{ticket.title}</span>
                        </div>
                      </td>

                      {/* Status (column name) */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-white text-xs font-semibold"
                          style={{ backgroundColor: ticket.columnColor }}
                        >
                          {ticket.columnName}
                        </span>
                      </td>

                      {/* Assignees */}
                      <td className="px-4 py-3">
                        <div className="flex -space-x-1.5">
                          {(ticket.assignees || []).slice(0, 3).map((a) => {
                            const u = a.users || a;
                            return (
                              <div
                                key={a.user_id}
                                title={u.full_name || u.username}
                                className="w-6 h-6 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-white overflow-hidden"
                              >
                                {u.profile_picture
                                  ? <img src={u.profile_picture} alt="" className="w-full h-full object-cover" />
                                  : getInitials(u)
                                }
                              </div>
                            );
                          })}
                          {(ticket.assignees || []).length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-[9px] font-bold flex items-center justify-center ring-1 ring-white">
                              +{ticket.assignees.length - 3}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Labels */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(ticket.labels || []).slice(0, 2).map((l) => {
                            const lbl = l.kanban_labels || l;
                            return (
                              <span
                                key={l.label_id}
                                className="px-1.5 py-0.5 rounded-full text-white text-[10px] font-semibold"
                                style={{ backgroundColor: lbl.color }}
                              >{lbl.name}</span>
                            );
                          })}
                          {(ticket.labels || []).length > 2 && (
                            <span className="text-xs text-gray-400">+{ticket.labels.length - 2}</span>
                          )}
                        </div>
                      </td>

                      {/* Due date */}
                      <td className="px-4 py-3">
                        {dueDate && (
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            overdue  ? 'bg-red-100 text-red-600' :
                            dueToday ? 'bg-amber-100 text-amber-700' :
                                       'bg-gray-100 text-gray-600'
                          }`}>
                            {format(dueDate, 'MMM d, yyyy')}
                          </span>
                        )}
                      </td>

                      {/* Checklist */}
                      <td className="px-4 py-3">
                        {ticket.tasks_total > 0 && (
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            ticket.tasks_done === ticket.tasks_total
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {ticket.tasks_done}/{ticket.tasks_total}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket modal */}
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
