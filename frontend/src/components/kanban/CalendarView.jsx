import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, isSameDay } from 'date-fns';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Build a 6-week grid for the given month
const buildGrid = (year, month) => {
  const firstDay = startOfMonth(new Date(year, month - 1, 1));
  const lastDay  = endOfMonth(firstDay);
  const start    = startOfWeek(firstDay);
  const end      = endOfWeek(lastDay);

  const days = [];
  let current = start;
  while (current <= end) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }
  return days;
};

export const CalendarView = ({ tickets = [], boardId, onTicketClick }) => {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const grid = buildGrid(year, month);

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };

  const ticketsByDate = {};
  tickets.forEach((t) => {
    if (!t.due_date) return;
    const key = t.due_date; // YYYY-MM-DD
    if (!ticketsByDate[key]) ticketsByDate[key] = [];
    ticketsByDate[key].push(t);
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">‹</button>
        <h3 className="text-base font-semibold text-gray-800">
          {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
        </h3>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">›</button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {grid.map((day, i) => {
          const key     = format(day, 'yyyy-MM-dd');
          const dayTickets = ticketsByDate[key] || [];
          const inMonth  = isSameMonth(day, new Date(year, month - 1, 1));
          const today    = isToday(day);

          return (
            <div
              key={i}
              className={`min-h-[100px] p-2 border-b border-r border-gray-100 ${!inMonth ? 'bg-gray-50/50' : ''}`}
            >
              <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                today
                  ? 'bg-blue-600 text-white'
                  : inMonth
                  ? 'text-gray-700'
                  : 'text-gray-300'
              }`}>
                {day.getDate()}
              </div>

              <div className="space-y-1">
                {dayTickets.slice(0, 3).map((t) => {
                  const lbl = t.labels?.[0]?.kanban_labels;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onTicketClick(t.id)}
                      className="w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate text-white hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: lbl?.color || t.cover_color || '#3B82F6' }}
                      title={t.title}
                    >
                      {t.title}
                    </button>
                  );
                })}
                {dayTickets.length > 3 && (
                  <span className="text-[9px] text-gray-400">+{dayTickets.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
