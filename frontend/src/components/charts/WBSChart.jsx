import { useLayoutEffect, useRef, useState } from 'react';
import { CATEGORY_STYLES, PRIORITY_CONFIG, STATUS_CONFIG } from './wbsConstants';

const formatDay = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
};

const StatusDot = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  if (cfg.done) {
    return (
      <span className="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-emerald-600 flex items-center justify-center text-white leading-none" style={{ fontSize: 8 }}>
        ✓
      </span>
    );
  }
  return <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-0.5 ${cfg.dotClass}`} />;
};

const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority];
  if (!cfg) return null;
  return (
    <span className={`flex-shrink-0 text-[9px] font-bold px-1 py-0.5 rounded leading-none ${cfg.class}`}>
      {cfg.label}
    </span>
  );
};

export const WBSChart = ({ data, teamMembers = [] }) => {
  const containerRef = useRef(null);
  const rootRef = useRef(null);
  const l1Refs = useRef([]);
  const [paths, setPaths] = useState([]);

  useLayoutEffect(() => {
    const calculate = () => {
      if (!containerRef.current || !rootRef.current) { setPaths([]); return; }

      const cRect = containerRef.current.getBoundingClientRect();
      const rRect = rootRef.current.getBoundingClientRect();
      const rootBottomX = rRect.left - cRect.left + rRect.width / 2;
      const rootBottomY = rRect.top - cRect.top + rRect.height;

      const l1Points = l1Refs.current.filter(Boolean).map(ref => {
        const rect = ref.getBoundingClientRect();
        return { x: rect.left - cRect.left + rect.width / 2, y: rect.top - cRect.top };
      });

      if (l1Points.length === 0) { setPaths([]); return; }

      const midY = rootBottomY + (l1Points[0].y - rootBottomY) / 2;
      const newPaths = [];
      newPaths.push(`M ${rootBottomX} ${rootBottomY} L ${rootBottomX} ${midY}`);
      if (l1Points.length > 1) {
        newPaths.push(`M ${l1Points[0].x} ${midY} L ${l1Points[l1Points.length - 1].x} ${midY}`);
      }
      l1Points.forEach(pt => newPaths.push(`M ${pt.x} ${midY} L ${pt.x} ${pt.y}`));
      setPaths(newPaths);
    };

    calculate();
    window.addEventListener('resize', calculate);
    return () => window.removeEventListener('resize', calculate);
  }, [data]);

  if (!data) return null;

  return (
    <div className="overflow-x-auto">
      <div ref={containerRef} className="relative p-8 pb-10 min-h-[320px] min-w-max">
        {/* SVG connectors */}
        <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {paths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
          ))}
        </svg>

        {/* L0 — Root node */}
        <div className="flex justify-center mb-16">
          <div
            ref={rootRef}
            className="bg-gradient-hero text-white px-10 py-3 rounded-full font-bold text-lg shadow-lg whitespace-nowrap"
          >
            {data.label || 'Project'}
          </div>
        </div>

        {/* L1 columns */}
        {data.children.length > 0 ? (
          <div className="flex gap-6 justify-center items-start">
            {data.children.map((l1, i) => (
              <div key={l1.id} className="flex flex-col items-center gap-3 w-[190px]">

                {/* L1 header pill */}
                <div className="relative group w-full">
                  <div
                    ref={el => (l1Refs.current[i] = el)}
                    className="w-full bg-forest-green text-white px-4 py-2 rounded-full text-center font-semibold text-sm shadow-md overflow-hidden"
                  >
                    <span className="block truncate">{l1.label}</span>
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                    {l1.label}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                  </div>
                </div>

                {/* L2 work package cards */}
                {l1.children && l1.children.length > 0 && (
                  <div className="flex flex-col gap-2 w-full">
                    {l1.children.map(l2 => {
                      const assignee = teamMembers.find(m => m.id === l2.assigneeId);
                      const isGate = l2.status === 'gate';
                      const isDone = l2.status === 'done';

                      return (
                        <div key={l2.id} className="relative group w-full">

                          {/* Note tooltip — shown on hover if note exists */}
                          {l2.note && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg max-w-[220px] text-center whitespace-normal opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                              {l2.note}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                            </div>
                          )}

                          {/* Card */}
                          <div className={`w-full px-3 py-2 rounded-xl border overflow-hidden transition-opacity ${
                            isGate
                              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                              : isDone
                              ? 'bg-gray-50 dark:bg-dm-elevated/40 border-gray-100 dark:border-dm-border opacity-50'
                              : 'bg-white dark:bg-dm-elevated border-emerald-100 dark:border-emerald-900/40'
                          }`}>
                            {/* Row 1: status dot + label + priority */}
                            <div className="flex items-start gap-1.5">
                              <StatusDot status={l2.status} />
                              <span className="flex-1 min-w-0 text-xs font-medium text-dark-charcoal dark:text-dm-text leading-snug">
                                {l2.label}
                              </span>
                              {l2.priority != null && <PriorityBadge priority={l2.priority} />}
                            </div>

                            {/* Row 2: category + day (only if either is set) */}
                            {(l2.category || l2.day) && (
                              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                {l2.category && (
                                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full leading-none ${CATEGORY_STYLES[l2.category] ?? 'bg-gray-100 text-gray-500'}`}>
                                    {l2.category}
                                  </span>
                                )}
                                {l2.day && (
                                  <span className="text-[9px] text-gray-400 dark:text-dm-muted font-medium leading-none">
                                    {formatDay(l2.day)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Assignee avatar badge */}
                          {assignee && (
                            <div className="absolute group/avatar" style={{ bottom: '-6px', right: '-6px' }}>
                              {assignee.profilePicture ? (
                                <img
                                  src={assignee.profilePicture}
                                  alt={assignee.name}
                                  className="w-5 h-5 rounded-full border-2 border-white dark:border-dm-card object-cover shadow-sm cursor-default"
                                />
                              ) : (
                                <div
                                  className="w-5 h-5 rounded-full border-2 border-white dark:border-dm-card flex items-center justify-center text-white text-[8px] font-bold shadow-sm cursor-default"
                                  style={{ backgroundColor: assignee.color }}
                                >
                                  {assignee.name?.[0]?.toUpperCase()}
                                </div>
                              )}
                              <div className="absolute bottom-full right-0 mb-1.5 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-[10px] rounded-md whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                                {assignee.name}
                                <div className="absolute top-full right-2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center text-gray-400 dark:text-dm-muted text-sm mt-8">
            Add a subproject using the editor on the right to build your WBS
          </div>
        )}
      </div>
    </div>
  );
};
