import React, { useState, useEffect } from 'react';
import { StatCard } from './StatCard';
import { getBadgeStyle } from '../utils/badgeStyles';
import api from '../services/api';

/**
 * DashboardView Component
 * 
 * Main dashboard view that displays key metrics using the Forest Gradient Theme
 * with StatCard components in a Bento Grid layout.
 */
export const DashboardView = ({ dashboardData, userRole }) => {
  // Extract dashboard statistics
  const stats = dashboardData || {};
  
  const [progressReports, setProgressReports] = useState([]);

  // Fetch progress reports - update every 30 seconds for dynamic updates
  useEffect(() => {
    const fetchData = async () => {
      try {
        const reportsResponse = await api.get('/progress-reports');
        // Backend wraps response in { success: true, data: [...] }
        const reports = reportsResponse?.data?.data;
        if (reports && Array.isArray(reports)) {
          console.log('Fetched progress reports:', reports.length, reports);
          setProgressReports(reports);
        } else {
          console.log('No reports found or invalid response format:', reportsResponse?.data);
          setProgressReports([]);
        }
      } catch (error) {
        console.error('Error fetching progress reports:', error);
        setProgressReports([]);
      }
    };

    fetchData();
    
    // Refetch every 30 seconds for dynamic updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Parse date string in format like "2/16/2026" or ISO format
  const parseReportDate = (dateStr) => {
    if (!dateStr) return null;
    let date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      const parts = dateStr.trim().split('/');
      if (parts.length === 3) {
        const [month, day, year] = parts.map(p => parseInt(p, 10));
        date = new Date(year, month - 1, day, 0, 0, 0, 0);
      }
    }
    return isNaN(date.getTime()) ? null : date;
  };

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

  // Get last week's progress count by day
  const getLastWeekProgressData = () => {
    const today = new Date();
    const daysData = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const startOfThisWeek = new Date(today);
    startOfThisWeek.setDate(today.getDate() - today.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
    
    console.log('Last week range:', startOfLastWeek.toLocaleDateString());
    console.log('Total reports to filter:', progressReports.length);
    
    const weekData = daysData.map((day, idx) => {
      const targetDate = new Date(startOfLastWeek);
      targetDate.setDate(startOfLastWeek.getDate() + idx);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);
      
      const dayReports = progressReports.filter(report => {
        if (!report.date) return false;
        const reportDate = parseReportDate(report.date);
        if (!reportDate) {
          console.warn('Could not parse date:', report.date);
          return false;
        }
        const inRange = reportDate >= targetDate && reportDate < nextDay;
        if (inRange) {
          console.log('Matched:', report.date, 'on', targetDate.toLocaleDateString());
        }
        return inRange;
      });
      
      return {
        day,
        count: dayReports.length,
        hasProgress: dayReports.length > 0,
        date: `${targetDate.getMonth() + 1}/${targetDate.getDate()}`
      };
    });
    
    console.log('Week data:', weekData);
    return weekData;
  };

  // Extract stats from backend structure (summary contains the stats)
  const summary = dashboardData?.summary || {};
  const totalProjects = summary.totalProjects || summary.totalBoards || 0;
  const totalCards = summary.totalCards || 0;
  const endedProjects = summary.completedProjects || summary.endedProjects || 0;
  const runningProjects = summary.activeProjects || summary.runningProjects || 0;
  const pendingProjects = summary.pendingProjects || 0;

  return (
    <div className="min-h-screen bg-surface-ground p-8">
      {/* Page Header with Action Buttons */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h2 className="text-4xl font-bold text-dark-charcoal mb-2">Dashboard</h2>
          <p className="text-gray-600 text-lg">
            Plan, prioritize, and accomplish your tasks with ease.
          </p>
        </div>

        {/* Action Buttons - Top Right */}
        <div className="flex gap-3">
          <button
            onClick={() => console.log('Import Data')}
            className="px-6 py-2 bg-white border-2 border-dark-charcoal text-dark-charcoal rounded-full font-semibold hover:bg-gray-50 transition-all duration-300"
          >
            Import Data
          </button>
          <button
            onClick={() => console.log('Add Project')}
            className="px-6 py-2 bg-gradient-hero text-white rounded-full font-semibold hover:shadow-lg transition-all duration-300"
          >
            + Add Project
          </button>
        </div>
      </div>

      {/* Row 1: Quick Stats (4 columns) - Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Hero Card - Total Projects (Gradient) */}
        <StatCard
          variant="hero"
          title="Total Projects"
          value={totalProjects}
          subtitle="All active and completed projects"
          icon="📊"
          trend={totalProjects > 0 ? "↑ +4" : ""}
        />

        {/* Ended Projects - White Card */}
        <StatCard
          variant="white"
          title="Ended Projects"
          value={endedProjects}
          subtitle="Successfully completed"
          icon="✓"
        />

        {/* Running Projects - White Card */}
        <StatCard
          variant="white"
          title="Running Projects"
          value={runningProjects}
          subtitle="Currently in progress"
          icon="⚡"
        />

        {/* Pending Projects - White Card */}
        <StatCard
          variant="white"
          title="Pending Project"
          value={pendingProjects}
          subtitle="Awaiting action"
          icon="⏳"
        />
      </div>

      {/* Row 2: Content Cards (3 columns) - Mix of gradients and white */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Project Analytics - Dark Gradient Card */}
        <div className="bg-gradient-dark text-white rounded-[24px] p-6 shadow-none hover:scale-105 transition-all duration-300">
          <h3 className="text-lg font-bold mb-2">Last Week's Progress</h3>
          <p className="text-xs text-white opacity-50 mb-4">Feb 5-11</p>
          <div className="flex-1 flex items-end justify-around h-48">
            {getLastWeekProgressData().map((dayData, idx) => (
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
        <div className="bg-white text-dark-charcoal rounded-[24px] p-6 shadow-card-soft hover:scale-105 transition-all duration-300">
          <h3 className="text-lg font-bold mb-4">Team Activity</h3>
          <div className="space-y-4">
            {progressReports.slice(0, 3).map((report, idx) => (
              <div key={idx} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-b-0">
                <div className="w-10 h-10 bg-gradient-hero text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {getInitials(report.memberName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{report.memberName}</p>
                  <p className="text-xs text-gray-600 truncate">{report.teamPlan || '-'}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full font-medium ${getBadgeStyle('category', report.category)}`}>
                    {report.category}
                  </span>
                </div>
              </div>
            ))}
            {progressReports.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Project Progress - White Card with Donut */}
        <div className="bg-white text-dark-charcoal rounded-[24px] p-6 shadow-card-soft hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold mb-6">Project Progress</h3>
          <div className="relative w-32 h-32 mb-6">
            {/* Simple donut chart */}
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#10b981"
                strokeWidth="8"
                strokeDasharray="141 188"
                transform="rotate(-90 50 50)"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
                strokeDasharray="47 188"
                strokeDashoffset="-141"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-3xl font-bold text-forest-green">41%</span>
              <span className="text-xs text-gray-600">Completed</span>
            </div>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-leaf-green rounded-full" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <span>Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Optional: Quick Stats Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          Dashboard updated • Last sync:
          <span className="font-medium text-dark-charcoal ml-1">Just now</span>
        </p>
      </div>
    </div>
  );
};

export default DashboardView;
