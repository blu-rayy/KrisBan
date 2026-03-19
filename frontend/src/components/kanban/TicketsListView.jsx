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
      <div className="bg-white dark:bg-dm-card border-b border-gray-100 dark:border-dm-border px-6 py-3 flex items-center gap-4 flex-wrap">
        {/* Board selector */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBoardId(b.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                b.id === activeBoardId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-dm-elevated text-gray-600 dark:text-dm-muted hover:bg-gray-200 dark:hover:bg-dm-elevated/80'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          className="ml-auto w-56 px-3 py-2 border border-gray-200 dark:border-dm-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-dm-elevated dark:text-dm-text dark:placeholder-dm-soft"
          placeholder="Search tickets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        {(loadingBoards || isLoading) && (
          <div className="text-center text-gray-400 dark:text-dm-soft py-16">Loading…</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center text-gray-400 dark:text-dm-soft py-16">
            {search ? 'No tickets match your search.' : 'No tickets in this board yet.'}
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
            <div className="bg-white dark:bg-dm-card rounded-2xl border border-gray-100 dark:border-dm-border shadow-sm overflow-hidden">
            <table className="w-full text-sm align-middle">
              <thead>
                  <tr className="border-b border-gray-100 dark:border-dm-border text-sm font-semibold text-gray-400 dark:text-dm-soft uppercase tracking-wider">
                  <th className="text-left px-6 py-4 w-[28%] min-w-[220px]">Title</th>
                  <th className="text-left px-6 py-4 w-[12%] min-w-[140px]">Status</th>
                  <th className="text-left px-6 py-4 w-[15%] min-w-[140px]">Assignees</th>
                  <th className="text-left px-6 py-4 w-[15%] min-w-[140px]">Labels</th>
                  <th className="text-left px-6 py-4 w-[15%] min-w-[140px]">Due</th>
                  <th className="text-left px-6 py-4 w-[15%] min-w-[120px]">Checklist</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => {
                  const dueDate = ticket.due_date ? new Date(`${ticket.due_date}T00:00:00`) : null;
                  const overdue  = dueDate && isPast(dueDate) && !isToday(dueDate);
                  const dueToday = dueDate && isToday(dueDate);
                  // Color logic for status (column name)
                  let statusBg = 'bg-gray-500';
                  let statusText = 'text-white';
                  if (ticket.columnName?.toLowerCase().includes('review')) {
                    statusBg = 'bg-yellow-500'; statusText = 'text-black';
                  } else if (ticket.columnName?.toLowerCase().includes('done')) {
                    statusBg = 'bg-emerald-600'; statusText = 'text-white';
                  } else if (ticket.columnName?.toLowerCase().includes('to do')) {
                    statusBg = 'bg-slate-600'; statusText = 'text-white';
                  }
                  const badgeSize = 'text-xs font-medium rounded-full px-2 py-0.5';

                  // Due date color
                  let dueClass = 'bg-gray-200 dark:bg-dm-elevated text-gray-700 dark:text-dm-muted';
                  if (overdue) dueClass = 'bg-red-600 text-white';
                  else if (dueToday) dueClass = 'bg-yellow-400 text-black';

                  // Checklist color
                  let checklistClass = 'bg-gray-200 dark:bg-dm-elevated text-gray-700 dark:text-dm-muted';
                  if (ticket.tasks_total > 0 && ticket.tasks_done === ticket.tasks_total) checklistClass = 'bg-emerald-600 text-white';

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className="border-b border-gray-50 dark:border-dm-border hover:bg-blue-50/40 dark:hover:bg-dm-elevated cursor-pointer transition-colors"
                    >
                      {/* Title */}
                      <td className="px-6 py-4 w-[28%] min-w-[220px] align-middle">
                        <div className="flex items-center gap-2">
                          {ticket.cover_color && (
                            <span className="w-1.5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: ticket.cover_color }} />
                          )}
                          <span className="font-medium text-gray-800 dark:text-dm-text">{ticket.title}</span>
                        </div>
                      </td>

                      {/* Status (column name) */}
                      <td className="px-6 py-4 w-[12%] min-w-[140px] align-middle">
                        <span
                          className={`inline-block rounded-full font-semibold ${badgeSize} ${statusBg} ${statusText}`}
                        >
                          {ticket.columnName}
                        </span>
                      </td>

                      {/* Assignees */}
                      <td className="px-6 py-4 w-[15%] min-w-[140px] align-middle">
                        <div className="flex -space-x-1.5">
                          {(ticket.assignees || []).slice(0, 3).map((a) => {
                            const u = a.users || a;
                            return (
                              <div
                                key={a.user_id}
                                title={u.full_name || u.username}
                                className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white overflow-hidden"
                              >
                                {u.profile_picture
                                  ? <img src={u.profile_picture} alt="" className="w-full h-full object-cover" />
                                  : getInitials(u)
                                }
                              </div>
                            );
                          })}
                          {(ticket.assignees || []).length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                              +{ticket.assignees.length - 3}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Labels */}
                      <td className="px-6 py-4 w-[15%] min-w-[140px] align-middle">
                        <div className="flex flex-wrap gap-1">
                          {(ticket.labels || []).slice(0, 2).map((l) => {
                            const lbl = l.kanban_labels || l;
                            // Use white text if color is dark, black if color is light
                            let textColor = 'text-white';
                            if (lbl.color) {
                              // Simple luminance check
                              const hex = lbl.color.replace('#', '');
                              const r = parseInt(hex.substring(0,2),16);
                              const g = parseInt(hex.substring(2,4),16);
                              const b = parseInt(hex.substring(4,6),16);
                              const luminance = (0.299*r + 0.587*g + 0.114*b)/255;
                              if (luminance > 0.6) textColor = 'text-black';
                            }
                            return (
                              <span
                                key={l.label_id}
                                className={`rounded-full font-semibold ${badgeSize} ${textColor}`}
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
                      <td className="px-6 py-4 w-[15%] min-w-[140px] align-middle">
                        {dueDate && (
                          <span className={`inline-block rounded-full font-semibold ${badgeSize} ${dueClass}`}>
                            {format(dueDate, 'MMM d, yyyy')}
                          </span>
                        )}
                      </td>

                      {/* Checklist */}
                      <td className="px-6 py-4 w-[15%] min-w-[120px] align-middle">
                        {ticket.tasks_total > 0 && (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${checklistClass}`}>
                            {ticket.tasks_done}/{ticket.tasks_total}
                            {ticket.tasks_done === ticket.tasks_total && (
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="10" cy="10" r="10" fill="#059669"/>
                                <path d="M6 10.5L9 13.5L14 8.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
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
