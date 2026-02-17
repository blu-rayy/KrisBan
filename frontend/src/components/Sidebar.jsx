import { useState } from 'react';

export const Sidebar = ({ activeSection, setActiveSection, userRole, onLogout }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '🏠',
      status: 'active',
      visibility: 'all',
      section: 'MENU'
    },
    {
      id: 'progress-reports',
      label: 'Progress Reports',
      icon: '📈',
      status: 'active',
      visibility: 'all',
      section: 'MENU',
      badge: 'NEW'
    },
    {
      id: 'sprints',
      label: 'Sprints',
      icon: '⚡',
      status: 'active',
      visibility: 'all',
      section: 'MENU'
    },
    {
      id: 'kanban',
      label: 'KanBan',
      icon: '📊',
      status: 'TBD',
      visibility: 'all',
      section: 'MENU'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: '📄',
      status: 'TBD',
      visibility: 'all',
      section: 'MENU'
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: '🎫',
      status: 'TBD',
      visibility: 'all',
      section: 'MENU'
    }
  ];

  const generalItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      action: () => console.log('Settings clicked'),
      section: 'GENERAL'
    },
    {
      id: 'help',
      label: 'Help',
      icon: '❓',
      action: () => console.log('Help clicked'),
      section: 'GENERAL'
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: '🚪',
      action: onLogout,
      section: 'GENERAL',
      isDanger: true
    }
  ];

  // Filter menu items based on user role
  const visibleItems = menuItems.filter(item => {
    if (item.visibility === 'admin' && userRole !== 'ADMIN') return false;
    return true;
  });

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-80px)] shadow-sm flex flex-col fixed left-0 top-20">
      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* MENU Section Label */}
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          MENU
        </div>

        {/* Menu Items */}
        {visibleItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            disabled={item.status === 'TBD'}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-300 ${
              activeSection === item.id
                ? 'bg-gradient-hero text-white shadow-md scale-105'
                : item.status === 'TBD'
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'hover:bg-gray-100 text-gray-700 hover:text-dark-charcoal'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <div className="flex-1">
              <span className="block font-medium text-sm">{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                {item.badge}
              </span>
            )}
            {item.status === 'TBD' && (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded font-medium">
                TBD
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* General Section - Bottom */}
      <div className="border-t border-gray-200 p-4 space-y-2">
        {/* GENERAL Section Label */}
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          GENERAL
        </div>

        {/* General Items */}
        {generalItems.map(item => (
          <button
            key={item.id}
            onClick={item.action}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-300 ${
              item.isDanger
                ? 'hover:bg-red-50 text-red-600 hover:text-red-700'
                : 'hover:bg-gray-100 text-gray-700 hover:text-dark-charcoal'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="block font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};
