import { useState, useEffect } from 'react';
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

const ExternalLinkIcon = () => (
  <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const getFavicon = (u) => {
  try {
    const { hostname } = new URL(u);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`;
  } catch { return null; }
};

export const TicketCard = ({ ticket, dragHandleProps, draggableProps, innerRef, onOpen, onToggleComplete }) => {
  const [bouncing, setBouncing] = useState(false);
  const [optimisticCompleted, setOptimisticCompleted] = useState(null);

  // Clear optimistic state once server data catches up
  useEffect(() => { setOptimisticCompleted(null); }, [ticket.is_completed]);

  const labels        = ticket.labels    || [];
  const assignees     = ticket.assignees || [];
  const hasTasks      = ticket.tasks_total > 0;
  const hasDesc       = !!ticket.description;
  const commentCount  = ticket.comments_count || 0;
  const attachCount   = ticket.attachments_count || 0;
  const isCompleted   = optimisticCompleted ?? !!ticket.is_completed;

  const handleToggleComplete = (e) => {
    e.stopPropagation();
    const next = !isCompleted;
    setOptimisticCompleted(next);
    if (next) {
      setBouncing(true);
      setTimeout(() => setBouncing(false), 400);
    }
    onToggleComplete(ticket.id, next);
  };
  const dueDate       = ticket.due_date ? new Date(`${ticket.due_date}T00:00:00`) : null;
  const overdue       = dueDate && isPast(dueDate) && !isToday(dueDate);
  const dueToday      = dueDate && isToday(dueDate);

  const showFooter = dueDate || hasTasks || hasDesc || commentCount > 0 || attachCount > 0 || assignees.length > 0;

  const dueDateClass = isCompleted
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
    : overdue
    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
    : dueToday
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
    : 'text-[#5e6c84] dark:text-dm-soft';

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      onClick={onOpen}
      className={`relative bg-white dark:bg-dm-card rounded-[8px] cursor-pointer group select-none transition-shadow hover:shadow-md ${isCompleted ? 'opacity-75' : ''}`}
      style={{
        ...draggableProps?.style,
        boxShadow: '0 1px 2px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
      }}
    >
      {/* Completed indicator — left green border strip */}
      {isCompleted && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[8px] bg-emerald-500" />
      )}

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

        {/* Attachment Preview (Trello-like) */}
        {Array.isArray(ticket.attachments) && ticket.attachments.length > 0 && (() => {
          const att = ticket.attachments[0];
          const url = att.url;
          const isImage = (u) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(u);
          const isGoogleDoc = (u) => /docs\.google\.com\/(document|spreadsheets|presentation)/.test(u);
          if (isImage(url)) {
            return (
              <div className="mb-2 rounded-lg overflow-hidden border border-gray-200 dark:border-dm-border bg-white dark:bg-dm-elevated">
                <img src={url} alt={att.name || 'Attachment'} className="w-full h-28 object-cover" loading="lazy" />
              </div>
            );
          } else if (isGoogleDoc(url)) {
            let embedUrl = url;
            if (url.includes('/edit')) embedUrl = url.replace('/edit', '/preview');
            return (
              <div className="mb-2 rounded-lg overflow-hidden border border-gray-200 dark:border-dm-border bg-white dark:bg-dm-elevated">
                <iframe
                  src={embedUrl}
                  title={att.name || 'Google Doc'}
                  className="w-full h-28"
                  style={{ border: 0 }}
                  allow="autoplay; encrypted-media"
                  loading="lazy"
                />
              </div>
            );
          } else {
            // Styled link preview box
            const favicon = getFavicon(url);
            return (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mb-2 flex items-center gap-2 px-2.5 py-2 rounded-lg border border-gray-200 dark:border-dm-border bg-gray-50 dark:bg-dm-elevated hover:bg-gray-100 dark:hover:bg-dm-card transition-colors group/link"
              >
                {favicon && (
                  <img src={favicon} alt="" className="w-4 h-4 flex-shrink-0 rounded-sm" />
                )}
                <span className="flex-1 truncate text-[11px] text-gray-600 dark:text-dm-muted font-medium min-w-0">
                  {att.name && att.name !== url ? att.name : url}
                </span>
                <ExternalLinkIcon />
              </a>
            );
          }
        })()}

        {/* Title row with sliding mark complete circle */}
        <div className="flex items-start">
          {onToggleComplete && (
            <div className={`flex-shrink-0 overflow-hidden transition-all duration-200 ease-out ${
              isCompleted
                ? 'max-w-[19px] pr-2'
                : 'max-w-0 pr-0 group-hover:max-w-[19px] group-hover:pr-2'
            }`}>
              <div className={`relative mt-0.5 ${bouncing ? 'animate-check-bounce' : ''}`}>
                <button
                  onClick={handleToggleComplete}
                  title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  className={`w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-gray-400 dark:border-dm-border hover:border-emerald-400 dark:hover:border-emerald-500'
                  }`}
                >
                  <svg className="w-[9px] h-[9px]" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline
                      points="1.5 6 4.5 9 10.5 3"
                      strokeDasharray="18"
                      strokeDashoffset={isCompleted ? 0 : 18}
                      style={{ transition: 'stroke-dashoffset 0.2s ease 0.05s' }}
                    />
                  </svg>
                </button>

                {/* Ray burst overlay */}
                {bouncing && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                      <span key={deg} className="absolute w-0 h-0" style={{ transform: `rotate(${deg}deg)` }}>
                        <span
                          className="absolute block w-[2px] h-[4px] bg-emerald-400 rounded-full animate-ray-shoot"
                          style={{ left: '-1px', top: '-12px' }}
                        />
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </div>
          )}
          <p className={`text-[13.5px] text-[#172b4d] dark:text-dm-text leading-snug font-medium transition-all duration-200 ${isCompleted ? 'line-through opacity-50' : ''}`}>
            {ticket.title}
          </p>
        </div>

        {/* Footer — metadata row */}
        {showFooter && (
          <div className="flex items-center justify-between gap-1 mt-2">
            <div className="flex items-center gap-1 flex-wrap">

              {/* Due date */}
              {dueDate && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-sm px-1.5 py-0.5 ${dueDateClass}`}>
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
