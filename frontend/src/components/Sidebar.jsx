import { useState } from 'react';

export const Sidebar = ({
  activeSection,
  setActiveSection,
  userRole,
  onLogout,
  isCollapsed = false,
  isMobile = false,
  isMobileOpen = false,
  onToggleCollapse,
  onCloseMobile
}) => {
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

  const desktopWidthClass = isCollapsed ? 'lg:w-20' : 'lg:w-64';
  const mobileVisibilityClass = isMobileOpen ? 'translate-x-0' : '-translate-x-full';
  const shouldShowText = !isCollapsed || isMobile;

  return (
    <aside
      className={`bg-white border-r border-gray-200 h-[calc(100vh-80px)] shadow-sm flex flex-col fixed left-0 top-20 z-40 transition-all duration-300 ${desktopWidthClass} w-72 max-w-[85vw] lg:max-w-none ${mobileVisibilityClass} lg:translate-x-0`}
    >
      <div className={`px-4 pt-4 ${shouldShowText ? 'flex justify-end' : 'flex justify-center'} lg:flex`}>
        <button
          onClick={isMobile ? onCloseMobile : onToggleCollapse}
          className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label={isMobile ? 'Close sidebar' : (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
        >
          {isMobile ? '✕' : (isCollapsed ? '→' : '←')}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* MENU Section Label */}
        {shouldShowText && (
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            MENU
          </div>
        )}

        {/* Menu Items */}
        {visibleItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              setActiveSection(item.id);
              if (isMobile) {
                onCloseMobile?.();
              }
            }}
            disabled={item.status === 'TBD'}
            className={`w-full flex items-center ${shouldShowText ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-lg text-left transition-all duration-300 ${
              activeSection === item.id
                ? 'bg-gradient-hero text-white shadow-md scale-105'
                : item.status === 'TBD'
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'hover:bg-gray-100 text-gray-700 hover:text-dark-charcoal'
            }`}
            title={!shouldShowText ? item.label : undefined}
          >
            <span className="text-lg">{item.icon}</span>
            {shouldShowText && (
              <div className="flex-1">
                <span className="block font-medium text-sm">{item.label}</span>
              </div>
            )}
            {item.badge && shouldShowText && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                {item.badge}
              </span>
            )}
            {item.status === 'TBD' && shouldShowText && (
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
        {shouldShowText && (
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            GENERAL
          </div>
        )}

        {/* General Items */}
        {generalItems.map(item => (
          <button
            key={item.id}
            onClick={item.action}
            className={`w-full flex items-center ${shouldShowText ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-lg text-left transition-all duration-300 ${
              item.isDanger
                ? 'hover:bg-red-50 text-red-600 hover:text-red-700'
                : 'hover:bg-gray-100 text-gray-700 hover:text-dark-charcoal'
            }`}
            title={!shouldShowText ? item.label : undefined}
          >
            <span className="text-lg">{item.icon}</span>
            {shouldShowText && <span className="block font-medium text-sm">{item.label}</span>}
          </button>
        ))}
      </div>
    </aside>
  );
};
