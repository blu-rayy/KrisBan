import { format, isPast, isToday } from 'date-fns';

// Avatar initials helper
export const getInitials = (user) => {
  const name = user?.full_name || user?.fullName || user?.username || '?';
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
};

// Trello-style icon components (inline SVG, no dep needed)
const ClockIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ChecklistIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 11 12 14 22 4"/>
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
);

const DescIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="19" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

export const TicketCard = ({ ticket, dragHandleProps, draggableProps, innerRef, onOpen }) => {
  const labels    = ticket.labels    || [];
  const assignees = ticket.assignees || [];
  const hasTasks  = ticket.tasks_total > 0;
  const hasDesc   = !!ticket.description;
  const dueDate   = ticket.due_date ? new Date(`${ticket.due_date}T00:00:00`) : null;
  const overdue   = dueDate && isPast(dueDate) && !isToday(dueDate);
  const dueToday  = dueDate && isToday(dueDate);
  const dueDone   = false; // future: track done state

  const showFooter = dueDate || hasTasks || hasDesc || assignees.length > 0;

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      onClick={onOpen}
      className="bg-white rounded-[3px] shadow-sm cursor-pointer hover:brightness-95 transition-all group select-none"
      style={{ boxShadow: '0 1px 0 rgba(9,30,66,.25)' }}
    >
      {/* Cover strip — Trello-style tall cover */}
      {ticket.cover_color && (
        <div
          className="h-8 rounded-t-[3px]"
          style={{ backgroundColor: ticket.cover_color }}
        />
      )}

      <div className="px-3 pt-2 pb-2">
        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {labels.map((l) => {
              const lbl = l.kanban_labels || l;
              return (
                <span
                  key={l.label_id || lbl.id}
                  className="inline-block h-2 min-w-[2.5rem] rounded-full text-transparent text-[0px]"
                  style={{ backgroundColor: lbl.color }}
                  title={lbl.name}
                />
              );
            })}
          </div>
        )}

        {/* Title */}
        <p className="text-[13px] text-[#172b4d] leading-snug font-normal mb-1">{ticket.title}</p>

        {/* Footer row — Trello icon strip */}
        {showFooter && (
          <div className="flex items-center justify-between gap-1 mt-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Due date */}
              {dueDate && (
                <span
                  className={`inline-flex items-center gap-0.5 text-[11px] font-medium rounded px-1 py-0.5 ${
                    overdue  ? 'bg-red-500 text-white' :
                    dueToday ? 'bg-amber-400 text-white' :
                               'text-[#5e6c84] bg-transparent'
                  }`}
                >
                  <ClockIcon />
                  {format(dueDate, 'MMM d')}
                </span>
              )}

              {/* Description indicator */}
              {hasDesc && (
                <span className="text-[#5e6c84] flex items-center">
                  <DescIcon />
                </span>
              )}

              {/* Checklist */}
              {hasTasks && (
                <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium rounded px-1 py-0.5 ${
                  ticket.tasks_done === ticket.tasks_total
                    ? 'bg-[#61bd4f] text-white'
                    : 'text-[#5e6c84]'
                }`}>
                  <ChecklistIcon />
                  {ticket.tasks_done}/{ticket.tasks_total}
                </span>
              )}
            </div>

            {/* Assignee avatars */}
            {assignees.length > 0 && (
              <div className="flex -space-x-1 ml-auto flex-shrink-0">
                {assignees.slice(0, 4).map((a) => {
                  const u = a.users || a;
                  return (
                    <div
                      key={a.user_id || u.id}
                      title={u.full_name || u.username}
                      className="w-6 h-6 rounded-full text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-white overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: stringToColor(u.full_name || u.username || 'U') }}
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
                  <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 text-[9px] font-bold flex items-center justify-center ring-1 ring-white">
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

// Deterministic color from string for avatar backgrounds
function stringToColor(str) {
  const PALETTE = ['#0052cc','#00875a','#bf2600','#403294','#0065ff','#ff5630','#36b37e','#6554c0','#ff8b00','#00a3bf'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
