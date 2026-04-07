import React, { useEffect, useState } from 'react';
import { StatCard } from './StatCard';
import { getBadgeStyle } from '../../utils/badgeStyles';
import { useLastWeekProgressStats, useRecentProgressActivity } from '../../hooks/useDashboardActivity';
import { requirementService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export const DashboardView = ({ dashboardData, userRole, teamName, onNavigateRequirements }) => {
  const stats = dashboardData || {};
  const { darkMode } = useTheme();

  const { data: progressReports = [] } = useRecentProgressActivity();
  const { data: lastWeekStats = { startDate: null, endDate: null, days: [] } } = useLastWeekProgressStats();

  const [overallProgress, setOverallProgress] = useState(null);

  useEffect(() => {
    requirementService.getOverallProgress()
      .then((res) => setOverallProgress(res.data?.overall ?? null))
      .catch(() => setOverallProgress(null));
  }, []);

  // Get initials from a name
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatShortDate = (dateValue) => {
    if (!dateValue) return '';
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const lastWeekRangeLabel = lastWeekStats.startDate && lastWeekStats.endDate
    ? `${formatShortDate(lastWeekStats.startDate)}-${formatShortDate(lastWeekStats.endDate)}`
    : 'No data';

  const weekProgressDays = Array.isArray(lastWeekStats.days) ? lastWeekStats.days : [];

  // Extract stats from backend structure (summary contains the stats)
  const summary = dashboardData?.summary || {};
  const totalProjects = summary.totalProjects || summary.totalBoards || 0;
  const totalCards = summary.totalCards || 0;
  const endedProjects = summary.completedProjects || summary.endedProjects || 0;
  const runningProjects = summary.activeProjects || summary.runningProjects || 0;
  const pendingProjects = summary.pendingProjects || 0;
  const dashboardTeamName = String(teamName || '').trim();
  const dashboardSubtitle = dashboardTeamName
    ? `Plan, prioritize, and accomplish tasks for ${dashboardTeamName}.`
    : 'Plan, prioritize, and accomplish your tasks with ease.';

  return (
    <div className="min-h-full bg-surface-ground dark:bg-dm-ground p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-8 sm:mb-12">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-charcoal dark:text-dm-text mb-2">Dashboard</h2>
          <p className="text-gray-600 dark:text-dm-muted text-sm sm:text-base lg:text-lg italic">
            {dashboardSubtitle}
          </p>
        </div>
      </div>

      {/* Row 1: Quick Stats (4 columns) - Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Hero Card - Total Tickets (Gradient) */}
        <StatCard
          variant="hero"
          title="Total Tickets"
          value="（´∇｀''）"
          subtitle="All active and completed tickets"
          icon="📊"
          trend=""
        />

        {/* Ended Tickets - White Card */}
        <StatCard
          variant="white"
          title="Ended Tickets"
          value="(ᵕ—ᴗ—)"
          subtitle="Successfully completed"
          icon="🎯"
        />

        {/* Running Tickets - White Card */}
        <StatCard
          variant="white"
          title="Running Tickets"
          value="( •̯́ ₃ •̯̀)"
          subtitle="Currently in progress"
          icon="⚡"
        />

        {/* Pending Ticket - White Card */}
        <StatCard
          variant="white"
          title="Pending Ticket"
          value="( ◡̀_◡́)ᕤ"
          subtitle="Awaiting action"
          icon="⏳"
        />
      </div>

      {/* Row 2: Content Cards (3 columns) - Mix of gradients and white */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Project Analytics - Dark Gradient Card */}
        <div className="bg-gradient-dark text-white rounded-[24px] p-6 shadow-none hover:scale-105 transition-all duration-300">
          <h3 className="text-lg font-bold mb-2">Last Week's Progress</h3>
          <p className="text-xs text-white opacity-50 mb-4">{lastWeekRangeLabel}</p>
          <div className="flex-1 flex items-end justify-around h-48">
            {weekProgressDays.map((dayData, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div
                  className="w-8 rounded-full transition-all duration-300 flex items-center justify-center font-bold text-xs text-white"
                  style={{
                    height: `${Math.max(30, dayData.count * 20)}px`,
                    backgroundColor: dayData.hasProgress ? '#10b981' : 'rgba(255,255,255,0.2)'
                  }}
                  title={`${dayData.date}: ${dayData.count} progress report${dayData.count !== 1 ? 's' : ''}`}
                />
                <span className="text-xs text-white opacity-70 font-medium">{dayData.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team Activity - White Card */}
        <div className="bg-white dark:bg-dm-card text-dark-charcoal dark:text-dm-text rounded-[24px] p-6 shadow-card-soft dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] hover:scale-105 transition-all duration-300">
          <h3 className="text-lg font-bold dark:text-dm-text mb-4">Team Activity</h3>
          <div className="space-y-3">
            {progressReports.slice(0, 3).map((report, idx, arr) => (
              <React.Fragment key={idx}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-hero text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
                  {report.memberProfilePicture ? (
                    <img
                      src={report.memberProfilePicture}
                      alt={report.memberName || 'Member'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(report.memberName)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm dark:text-dm-text">{report.memberName}</p>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {formatShortDate(report.createdAt || report.date)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-dm-muted truncate">{report.teamPlan || '-'}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full font-medium ${getBadgeStyle('category', report.category)}`}>
                    {report.category}
                  </span>
                </div>
              </div>
              {idx < arr.length - 1 && (
                <div className="h-px bg-gray-100 dark:bg-dm-border rounded-full" />
              )}
              </React.Fragment>
            ))}
            {progressReports.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Project Progress - Clickable live donut */}
        {(() => {
          const pct = overallProgress !== null ? overallProgress : 0;
          const r = 45;
          const circ = 2 * Math.PI * r;
          const filled = (pct / 100) * circ;

          return (
            <button
              type="button"
              onClick={onNavigateRequirements}
              className="bg-white dark:bg-dm-card text-dark-charcoal dark:text-dm-text rounded-[24px] p-6 shadow-card-soft dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-100 transition-all duration-300 flex flex-col items-center justify-center w-full cursor-pointer group"
            >
              <h3 className="text-lg font-bold dark:text-dm-text mb-6 group-hover:text-forest-green transition-colors">
                Project Progress
              </h3>
              <div className="relative w-32 h-32 mb-4">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="dash-donut-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#15803d" />
                      <stop offset="100%" stopColor="#15803d" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r={r} fill="none" stroke={darkMode ? 'rgba(255,255,255,0.15)' : '#e5e7eb'} strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r={r} fill="none"
                    stroke="url(#dash-donut-grad)" strokeWidth="8"
                    strokeDasharray={`${filled} ${circ}`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  {overallProgress === null ? (
                    <span className="text-sm text-gray-400">—</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-forest-green">{pct.toFixed(1)}%</span>
                      <span className="text-xs text-gray-500 dark:text-dm-muted">Completed</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-dm-muted group-hover:text-forest-green transition-colors">
                View Requirements →
              </p>
            </button>
          );
        })()}
      </div>

      {/* Optional: Quick Stats Footer */}
      <div className="mt-12 pt-8">
        <div className="h-px bg-gray-100 dark:bg-dm-border rounded-full mb-8" />
        <p className="text-sm text-gray-600 dark:text-dm-muted text-center">
          Dashboard updated • Last sync:
          <span className="font-medium text-dark-charcoal dark:text-dm-text ml-1">Just now</span>
        </p>
      </div>
    </div>
  );
};

export default DashboardView;
