import { format, isPast, isToday } from 'date-fns';

// Avatar initials helper
export const getInitials = (user) => {
  const name = user?.full_name || user?.fullName || user?.username || '?';
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
};

const ClockIcon = () => (
  <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ChecklistIcon = () => (
  <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 11 12 14 22 4"/>
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
);

const DescIcon = () => (
  <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="19" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const CommentIcon = () => (
  <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const AttachIcon = () => (
  <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);

export const TicketCard = ({ ticket, dragHandleProps, draggableProps, innerRef, onOpen }) => {
  const labels        = ticket.labels    || [];
  const assignees     = ticket.assignees || [];
  const hasTasks      = ticket.tasks_total > 0;
  const hasDesc       = !!ticket.description;
  const commentCount  = ticket.comments_count || 0;
  const attachCount   = ticket.attachments_count || 0;
  const dueDate       = ticket.due_date ? new Date(`${ticket.due_date}T00:00:00`) : null;
  const overdue       = dueDate && isPast(dueDate) && !isToday(dueDate);
  const dueToday      = dueDate && isToday(dueDate);

  const showFooter = dueDate || hasTasks || hasDesc || commentCount > 0 || attachCount > 0 || assignees.length > 0;

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      onClick={onOpen}
      className="relative bg-white dark:bg-dm-card rounded-[8px] cursor-pointer group select-none transition-shadow hover:shadow-md"
      style={{
        ...draggableProps?.style,
        boxShadow: '0 1px 2px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
      }}
    >
      {/* Cover — solid color strip */}
      {ticket.cover_color && (
        <div
          className="h-10 rounded-t-[8px]"
          style={{ backgroundColor: ticket.cover_color }}
        />
      )}

      {/* Pencil quick-edit button — top-right on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onOpen(); }}
        className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center bg-white dark:bg-dm-elevated text-[#5e6c84] dark:text-dm-soft hover:text-[#172b4d] dark:hover:text-dm-text rounded shadow-sm border border-gray-200 dark:border-dm-border"
        title="Edit card"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>

      <div className="px-3 pt-2.5 pb-3">
        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {labels.map((l) => {
              const lbl = l.kanban_labels || l;
              return (
                <span
                  key={l.label_id || lbl.id}
                  className="inline-flex items-center h-[10px] min-w-[40px] max-w-[80px] rounded-full"
                  style={{ backgroundColor: lbl.color }}
                  title={lbl.name}
                />
              );
            })}
          </div>
        )}

        {/* Title */}
        <p className="text-[13.5px] text-[#172b4d] dark:text-dm-text leading-snug font-medium">
          {ticket.title}
        </p>

        {/* Footer — metadata row */}
        {showFooter && (
          <div className="flex items-center justify-between gap-1 mt-2">
            <div className="flex items-center gap-1 flex-wrap">

              {/* Due date */}
              {dueDate && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-sm px-1.5 py-0.5 ${
                  overdue  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                  dueToday ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                             'text-[#5e6c84] dark:text-dm-soft'
                }`}>
                  <ClockIcon />
                  {format(dueDate, 'MMM d')}
                </span>
              )}

              {/* Description */}
              {hasDesc && (
                <span className="inline-flex items-center text-[#8993a4] dark:text-dm-soft">
                  <DescIcon />
                </span>
              )}

              {/* Checklist */}
              {hasTasks && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-sm px-1.5 py-0.5 ${
                  ticket.tasks_done === ticket.tasks_total
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : 'text-[#5e6c84] dark:text-dm-soft'
                }`}>
                  <ChecklistIcon />
                  {ticket.tasks_done}/{ticket.tasks_total}
                </span>
              )}

              {/* Comments */}
              {commentCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5e6c84] dark:text-dm-soft">
                  <CommentIcon />
                  {commentCount}
                </span>
              )}

              {/* Attachments */}
              {attachCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5e6c84] dark:text-dm-soft">
                  <AttachIcon />
                  {attachCount}
                </span>
              )}
            </div>

            {/* Assignee avatars */}
            {assignees.length > 0 && (
              <div className="flex -space-x-1.5 ml-auto flex-shrink-0">
                {assignees.slice(0, 4).map((a) => {
                  const u = a.users || a;
                  return (
                    <div
                      key={a.user_id || u.id}
                      title={u.full_name || u.username}
                      className="w-6 h-6 rounded-full text-white text-[9px] font-bold flex items-center justify-center ring-[1.5px] ring-white dark:ring-dm-card overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: stringToColor(u.full_name || u.fullName || u.username || 'U') }}
                    >
                      {(u.profile_picture || u.profilePicture) ? (
                        <img src={u.profile_picture || u.profilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(u)
                      )}
                    </div>
                  );
                })}
                {assignees.length > 4 && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-dm-elevated text-gray-600 dark:text-dm-muted text-[9px] font-bold flex items-center justify-center ring-[1.5px] ring-white dark:ring-dm-card">
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
  const PALETTE = ['#15803d','#00875a','#bf2600','#403294','#0065ff','#ff5630','#36b37e','#6554c0','#ff8b00','#00a3bf'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
