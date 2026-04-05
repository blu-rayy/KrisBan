import { useLayoutEffect, useRef, useState } from 'react';

export const WBSChart = ({ data, teamMembers = [] }) => {
  const containerRef = useRef(null);
  const rootRef = useRef(null);
  const l1Refs = useRef([]);
  const [paths, setPaths] = useState([]);

  useLayoutEffect(() => {
    const calculate = () => {
      if (!containerRef.current || !rootRef.current) {
        setPaths([]);
        return;
      }

      const cRect = containerRef.current.getBoundingClientRect();
      const rRect = rootRef.current.getBoundingClientRect();

      const rootBottomX = rRect.left - cRect.left + rRect.width / 2;
      const rootBottomY = rRect.top - cRect.top + rRect.height;

      const l1Points = l1Refs.current
        .filter(Boolean)
        .map(ref => {
          const rect = ref.getBoundingClientRect();
          return {
            x: rect.left - cRect.left + rect.width / 2,
            y: rect.top - cRect.top,
          };
        });

      if (l1Points.length === 0) {
        setPaths([]);
        return;
      }

      const midY = rootBottomY + (l1Points[0].y - rootBottomY) / 2;
      const newPaths = [];

      newPaths.push(`M ${rootBottomX} ${rootBottomY} L ${rootBottomX} ${midY}`);

      if (l1Points.length > 1) {
        newPaths.push(`M ${l1Points[0].x} ${midY} L ${l1Points[l1Points.length - 1].x} ${midY}`);
      }

      l1Points.forEach(pt => {
        newPaths.push(`M ${pt.x} ${midY} L ${pt.x} ${pt.y}`);
      });

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
      {/* SVG connector overlay */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#15803d"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ))}
      </svg>

      {/* Level 0 — Root node */}
      <div className="flex justify-center mb-16">
        <div
          ref={rootRef}
          className="bg-gradient-hero text-white px-10 py-3 rounded-full font-bold text-lg shadow-lg whitespace-nowrap"
        >
          {data.label || 'Project'}
        </div>
      </div>

      {/* Level 1 columns + Level 2 work packages */}
      {data.children.length > 0 ? (
        <div className="flex gap-6 justify-center items-start">
          {data.children.map((l1, i) => (
            <div key={l1.id} className="flex flex-col items-center gap-3 w-[180px]">
              {/* L1 header */}
              <div className="relative group w-full">
                <div
                  ref={el => (l1Refs.current[i] = el)}
                  className="w-full bg-forest-green text-white px-4 py-2 rounded-full text-center font-semibold text-sm shadow-md overflow-hidden"
                >
                  <span className="block truncate">{l1.label}</span>
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                  {l1.label}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                </div>
              </div>

              {/* L2 work packages */}
              {l1.children && l1.children.length > 0 && (
                <div className="flex flex-col gap-3 w-full">
                  {l1.children.map(l2 => {
                    const assignee = teamMembers.find(m => m.id === l2.assigneeId);
                    return (
                      <div key={l2.id} className="relative group w-full">
                        {/* Pill */}
                        <div className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-4 py-2 rounded-full text-center text-xs font-medium overflow-hidden">
                          <span className="block truncate">{l2.label}</span>
                        </div>

                        {/* Assignee avatar badge */}
                        {assignee && (
                          <div className="absolute group/avatar" style={{ bottom: '-6px', right: '-6px' }}>
                            <div
                              className="w-5 h-5 rounded-full border-2 border-white dark:border-dm-card flex items-center justify-center text-white text-[8px] font-bold shadow-sm cursor-default"
                              style={{ backgroundColor: assignee.color }}
                            />
                            {/* Assignee tooltip */}
                            <div className="absolute bottom-full right-0 mb-1.5 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-[10px] rounded-md whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                              {assignee.name}
                              <div className="absolute top-full right-2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                            </div>
                          </div>
                        )}

                        {/* Label tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                          {l2.label}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                        </div>
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
          Add subprojects in the debug panel to build your WBS
        </div>
      )}
    </div>
    </div>
  );
};
