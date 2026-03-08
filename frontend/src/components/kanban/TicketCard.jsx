import { format, isPast, isToday } from 'date-fns';

// Avatar initials helper
export const getInitials = (user) => {
  const name = user?.full_name || user?.fullName || user?.username || '?';
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
};

export const TicketCard = ({ ticket, dragHandleProps, draggableProps, innerRef, onOpen }) => {
  const labels   = ticket.labels   || [];
  const assignees = ticket.assignees || [];
  const hasTasks = ticket.tasks_total > 0;
  const dueDate  = ticket.due_date ? new Date(`${ticket.due_date}T00:00:00`) : null;
  const overdue  = dueDate && isPast(dueDate) && !isToday(dueDate);
  const dueToday = dueDate && isToday(dueDate);

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      onClick={onOpen}
      className="bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group select-none"
    >
      {/* Cover strip */}
      {ticket.cover_color && (
        <div
          className="h-2 rounded-t-xl"
          style={{ backgroundColor: ticket.cover_color }}
        />
      )}

      <div className="p-3 space-y-2">
        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {labels.map((l) => {
              const lbl = l.kanban_labels || l;
              return (
                <span
                  key={l.label_id || lbl.id}
                  className="inline-block px-2 py-0.5 rounded-full text-white text-[10px] font-semibold"
                  style={{ backgroundColor: lbl.color }}
                >
                  {lbl.name}
                </span>
              );
            })}
          </div>
        )}

        {/* Title */}
        <p className="text-sm font-medium text-gray-800 leading-snug">{ticket.title}</p>

        {/* Footer row */}
        {(dueDate || hasTasks || assignees.length > 0) && (
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              {/* Due date */}
              {dueDate && (
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    overdue  ? 'bg-red-100 text-red-600' :
                    dueToday ? 'bg-amber-100 text-amber-700' :
                               'bg-gray-100 text-gray-500'
                  }`}
                >
                  {format(dueDate, 'MMM d')}
                </span>
              )}

              {/* Checklist */}
              {hasTasks && (
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  ticket.tasks_done === ticket.tasks_total
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  ✓ {ticket.tasks_done}/{ticket.tasks_total}
                </span>
              )}
            </div>

            {/* Assignee avatars */}
            {assignees.length > 0 && (
              <div className="flex -space-x-1.5">
                {assignees.slice(0, 4).map((a) => {
                  const u = a.users || a;
                  return (
                    <div
                      key={a.user_id || u.id}
                      title={u.full_name || u.username}
                      className="w-5 h-5 rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center ring-1 ring-white overflow-hidden flex-shrink-0"
                    >
                      {u.profile_picture ? (
                        <img src={u.profile_picture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(u)
                      )}
                    </div>
                  );
                })}
                {assignees.length > 4 && (
                  <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[8px] font-bold flex items-center justify-center ring-1 ring-white">
                    +{assignees.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
