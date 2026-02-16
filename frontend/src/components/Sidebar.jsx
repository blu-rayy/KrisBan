import { useState } from 'react';

export const Sidebar = ({ activeSection, setActiveSection, userRole }) => {
  const menuItems = [
    {
      id: 'kanban',
      label: 'KanBan',
      icon: '📊',
      status: 'TBD',
      visibility: 'all'
    },
    {
      id: 'sprints',
      label: 'Sprints',
      icon: '⚡',
      status: 'active',
      visibility: 'all'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: '📄',
      status: 'TBD',
      visibility: 'all'
    },
    {
      id: 'progress-reports',
      label: 'Progress Reports',
      icon: '📈',
      status: 'active',
      visibility: 'all' // Available for all users
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: '🎫',
      status: 'TBD',
      visibility: 'all'
    }
  ];

  // Filter menu items based on user role
  const visibleItems = menuItems.filter(item => {
    if (item.visibility === 'admin' && userRole !== 'ADMIN') return false;
    return true;
  });

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-[calc(100vh-80px)] shadow-lg">
      <nav className="p-4 space-y-2">
        {visibleItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            disabled={item.status === 'TBD'}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition ${
              activeSection === item.id
                ? 'bg-blue-600 text-white'
                : item.status === 'TBD'
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'hover:bg-gray-800 text-gray-300 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1">
              <span className="block font-medium">{item.label}</span>
            </div>
            {item.status === 'TBD' && (
              <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-400">TBD</span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
};
