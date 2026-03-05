import React, { useState } from 'react';
import { StatCard } from './StatCard';

/**
 * BentoDashboard Component - Premium Modern Design with Forest Gradient Theme
 * 
 * This component demonstrates the complete Bento Grid layout with:
 * - Mix of gradient and white cards
 * - Proper visual hierarchy
 * - "Inverted" icon contrast (white bg + colored icon on gradients)
 * - Strategic gradient placement (1-2 per row max)
 */
export const BentoDashboard = ({ dashboardData, userRole }) => {
  const [hoveredCard, setHoveredCard] = useState(null);

  // Sample dashboard stats - replace with actual data from props
  const stats = {
    totalTickets: {
      variant: 'hero',
      title: 'Total Tickets',
      value: '（´∇｀\'\'）',
      subtitle: 'Increased from last month',
      icon: '📊',
      trend: '',
      gridClass: 'col-span-1 row-span-1'
    },
    endedTickets: {
      variant: 'white',
      title: 'Ended Tickets',
      value: '(ᵕ—ᴗ—)',
      subtitle: 'Increased from last month',
      icon: '✓',
      trend: null,
      gridClass: 'col-span-1 row-span-1'
    },
    runningTickets: {
      variant: 'white',
      title: 'Running Tickets',
      value: '( •̯́ ₃ •̯̀)',
      subtitle: 'Increased from last month',
      icon: '⚡',
      trend: null,
      gridClass: 'col-span-1 row-span-1'
    },
    pendingTickets: {
      variant: 'white',
      title: 'Pending Ticket',
      value: '( ◡̀_◡́)ᕤ',
      subtitle: 'On Discussion',
      icon: '⏳',
      trend: null,
      gridClass: 'col-span-1 row-span-1'
    }
  };

  return (
    <div className="min-h-screen bg-surface-ground p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-dark-charcoal mb-2">Dashboard</h2>
        <p className="text-gray-600">Plan, prioritize, and accomplish your tasks with ease.</p>
      </div>

      {/* Main Bento Grid - Row 1: Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Hero Card - Gradient (Large) */}
        <div className={`${stats.totalTickets.gridClass}`}>
          <StatCard
            variant={stats.totalTickets.variant}
            title={stats.totalTickets.title}
            value={stats.totalTickets.value}
            subtitle={stats.totalTickets.subtitle}
            icon={stats.totalTickets.icon}
            trend={stats.totalTickets.trend}
            onMouseEnter={() => setHoveredCard('totalTickets')}
            onMouseLeave={() => setHoveredCard(null)}
          />
        </div>

        {/* Ended Tickets - White */}
        <div className={`${stats.endedTickets.gridClass}`}>
          <StatCard
            variant={stats.endedTickets.variant}
            title={stats.endedTickets.title}
            value={stats.endedTickets.value}
            subtitle={stats.endedTickets.subtitle}
            icon={stats.endedTickets.icon}
            trend={stats.endedTickets.trend}
            onMouseEnter={() => setHoveredCard('endedTickets')}
            onMouseLeave={() => setHoveredCard(null)}
          />
        </div>

        {/* Running Tickets - White */}
        <div className={`${stats.runningTickets.gridClass}`}>
          <StatCard
            variant={stats.runningTickets.variant}
            title={stats.runningTickets.title}
            value={stats.runningTickets.value}
            subtitle={stats.runningTickets.subtitle}
            icon={stats.runningTickets.icon}
            trend={stats.runningTickets.trend}
            onMouseEnter={() => setHoveredCard('runningTickets')}
            onMouseLeave={() => setHoveredCard(null)}
          />
        </div>

        {/* Pending Ticket - White */}
        <div className={`${stats.pendingTickets.gridClass}`}>
          <StatCard
            variant={stats.pendingTickets.variant}
            title={stats.pendingTickets.title}
            value={stats.pendingTickets.value}
            subtitle={stats.pendingTickets.subtitle}
            icon={stats.pendingTickets.icon}
            trend={stats.pendingTickets.trend}
            onMouseEnter={() => setHoveredCard('pendingTickets')}
            onMouseLeave={() => setHoveredCard(null)}
          />
        </div>
      </div>

      {/* Secondary Bento Grid - Row 2: Content Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Project Analytics - Dark Gradient Card */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-dark text-white rounded-[24px] p-6 shadow-none h-full flex flex-col">
            <h3 className="text-lg font-bold mb-6">Project Analytics</h3>
            <div className="flex-1 flex items-end justify-around">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div
                    className="w-8 rounded-full"
                    style={{
                      height: `${Math.random() * 100 + 30}px`,
                      backgroundColor: idx % 2 === 0 ? '#10b981' : 'rgba(255,255,255,0.2)'
                    }}
                  />
                  <span className="text-xs text-white opacity-70">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Collaboration - White Card */}
        <div className="lg:col-span-1">
          <div className="bg-surface-main text-dark-charcoal rounded-[24px] p-6 shadow-card-soft h-full">
            <h3 className="text-lg font-bold mb-4">Team Collaboration</h3>
            {[
              { name: 'Alexandra Derr', role: 'GitHub Project Repository', status: 'Completed' },
              { name: 'Edwin Adenike', role: 'Integrate User Authentication System', status: 'In Progress' },
              { name: 'Isaac Oluwemiluwon', role: 'Develop Search and Filter Functionality', status: 'Pending' }
            ].map((member, idx) => (
              <div key={idx} className="mb-4 pb-4 border-b border-gray-100 last:border-b-0">
                <p className="font-semibold text-sm">{member.name}</p>
                <p className="text-xs text-gray-600 mb-2">{member.role}</p>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    member.status === 'Completed'
                      ? 'bg-green-100 text-green-700'
                      : member.status === 'In Progress'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {member.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Progress - White Card with Donut Chart */}
        <div className="lg:col-span-1">
          <div className="bg-surface-main text-dark-charcoal rounded-[24px] p-6 shadow-card-soft h-full flex flex-col items-center justify-center">
            <h3 className="text-lg font-bold mb-6">Project Progress</h3>
            <div className="relative w-32 h-32 mb-4">
              {/* Simple donut chart visualization */}
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
                <span className="text-xs text-gray-600">Project Ended</span>
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
      </div>

      {/* Action Cards Row - Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Project Button - Hero Gradient */}
        <div>
          <button className="w-full bg-gradient-action text-white rounded-[24px] p-6 shadow-none hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 font-semibold h-20">
            <span className="text-xl">+</span>
            Add Project
          </button>
        </div>

        {/* Reminders / Time Tracker - Dark Gradient */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-dark text-white rounded-[24px] p-6 shadow-none h-full flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold mb-2">Time Tracker</h3>
              <p className="text-sm text-white text-opacity-80">Track your productivity</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold font-mono">01:24:08</div>
              <div className="flex gap-2 mt-4">
                <button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition">
                  ⏸
                </button>
                <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition">
                  ⏹
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BentoDashboard;
