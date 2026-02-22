import { HugeiconsIcon } from '@hugeicons/react';
import {
  Cancel01Icon,
  ChartBarLineIcon,
  DashboardSquare01Icon,
  DocumentAttachmentIcon,
  FlashIcon,
  HelpCircleIcon,
  KanbanIcon,
  Menu01Icon,
  Settings01Icon,
  Ticket01Icon
} from '@hugeicons/core-free-icons';

export const Sidebar = ({
  activeSection,
  setActiveSection,
  userRole,
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
      icon: DashboardSquare01Icon,
      status: 'active',
      visibility: 'all',
      section: 'MENU'
    },
    {
      id: 'progress-reports',
      label: 'Progress Reports',
      icon: ChartBarLineIcon,
      status: 'active',
      visibility: 'all',
      section: 'MENU'
    },
    {
      id: 'sprints',
      label: 'Sprints',
      icon: FlashIcon,
      status: 'active',
      visibility: 'all',
      section: 'MENU'
    },
    {
      id: 'kanban',
      label: 'KanBan',
      icon: KanbanIcon,
      status: 'TBD',
      visibility: 'all',
      section: 'MENU'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: DocumentAttachmentIcon,
      status: 'TBD',
      visibility: 'all',
      section: 'MENU'
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: Ticket01Icon,
      status: 'TBD',
      visibility: 'all',
      section: 'MENU'
    }
  ];

  const generalItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings01Icon,
      action: () => console.log('Settings clicked'),
      section: 'GENERAL'
    },
    {
      id: 'help',
      label: 'Help',
      icon: HelpCircleIcon,
      action: () => console.log('Help clicked'),
      section: 'GENERAL'
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
      className={`bg-white border-r border-gray-200 h-[calc(100vh-80px)] shadow-sm flex flex-col fixed left-0 top-20 z-40 transition-[width,transform] duration-300 ease-in-out ${desktopWidthClass} w-72 max-w-[85vw] lg:max-w-none ${mobileVisibilityClass} lg:translate-x-0`}
    >
      <div className="px-4 pt-4 pb-2 h-14 relative">
        <button
          onClick={isMobile ? onCloseMobile : onToggleCollapse}
          className={`inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all duration-300 ease-in-out absolute top-4 ${
            isMobile
              ? 'right-4'
              : isCollapsed
              ? 'left-1/2 -translate-x-1/2'
              : 'left-4'
          }`}
          aria-label={isMobile ? 'Close sidebar' : 'Toggle sidebar'}
        >
          <HugeiconsIcon
            icon={isMobile ? Cancel01Icon : Menu01Icon}
            size={18}
            color="currentColor"
          />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Menu Items */}
        {visibleItems.map(item => (
          (() => {
            const isActive = activeSection === item.id;
            const iconColorClass = isActive ? 'text-white' : 'text-forest-green';
            return (
          <button
            key={item.id}
            onClick={() => {
              setActiveSection(item.id);
              if (isMobile) {
                onCloseMobile?.();
              }
            }}
            disabled={item.status === 'TBD'}
            className={`w-full h-12 flex items-center ${shouldShowText ? 'space-x-3 px-4' : 'justify-center px-2'} rounded-lg text-left transition-colors duration-200 ${
              isActive
                ? 'bg-gradient-hero text-white shadow-md'
                : item.status === 'TBD'
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'hover:bg-gray-100 text-gray-700 hover:text-dark-charcoal'
            }`}
            title={!shouldShowText ? item.label : undefined}
          >
            <span className={`inline-flex items-center justify-center ${iconColorClass}`}>
              <HugeiconsIcon icon={item.icon} size={20} color="currentColor" />
            </span>
            <div
              className={`min-w-0 overflow-hidden transition-[max-width,opacity,margin] duration-300 ease-in-out ${
                shouldShowText ? 'flex-1 max-w-[180px] opacity-100 ml-0' : 'max-w-0 opacity-0 ml-0'
              }`}
            >
              <span className="block font-medium text-sm truncate whitespace-nowrap">{item.label}</span>
            </div>
            {item.badge && (
              <span
                className={`text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold whitespace-nowrap overflow-hidden transition-[max-width,opacity,margin] duration-300 ease-in-out ${
                  shouldShowText ? 'max-w-16 opacity-100 ml-1' : 'max-w-0 opacity-0 ml-0 px-0 py-0'
                }`}
              >
                {item.badge}
              </span>
            )}
            {item.status === 'TBD' && (
              <span
                className={`text-xs bg-gray-200 text-gray-600 rounded font-medium whitespace-nowrap overflow-hidden transition-[max-width,opacity,margin,padding] duration-300 ease-in-out ${
                  shouldShowText ? 'max-w-16 opacity-100 ml-1 px-2 py-1' : 'max-w-0 opacity-0 ml-0 px-0 py-0'
                }`}
              >
                TBD
              </span>
            )}
          </button>
            );
          })()
        ))}
      </nav>

      {/* General Section - Bottom */}
      <div className="border-t border-gray-200 p-4 space-y-2">
        {/* General Items */}
        {generalItems.map(item => (
          (() => {
            const iconColorClass = 'text-forest-green';
            return (
          <button
            key={item.id}
            onClick={item.action}
            className={`w-full h-12 flex items-center ${shouldShowText ? 'space-x-3 px-4' : 'justify-center px-2'} rounded-lg text-left transition-colors duration-200 ${
              item.isDanger
                ? 'hover:bg-red-50 text-red-600 hover:text-red-700'
                : 'hover:bg-gray-100 text-gray-700 hover:text-dark-charcoal'
            }`}
            title={!shouldShowText ? item.label : undefined}
          >
            <span className={`inline-flex items-center justify-center ${iconColorClass}`}>
              <HugeiconsIcon icon={item.icon} size={20} color="currentColor" />
            </span>
            <span
              className={`block font-medium text-sm truncate whitespace-nowrap overflow-hidden transition-[max-width,opacity,margin] duration-300 ease-in-out ${
                shouldShowText ? 'max-w-[140px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'
              }`}
            >
              {item.label}
            </span>
          </button>
            );
          })()
        ))}
      </div>
    </aside>
  );
};
