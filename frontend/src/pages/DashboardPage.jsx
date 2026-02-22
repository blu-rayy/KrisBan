import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { DashboardView } from '../components/DashboardView';
import { ProgressReportsView } from '../components/ProgressReportsView';
import { SprintsView } from '../components/SprintsView';
import { PlaceholderSection } from '../components/PlaceholderSection';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { useDashboardData } from '../hooks/useDashboardData';
import { useQueryClient } from '@tanstack/react-query';
import { sprintService } from '../services/sprintService';
import { HugeiconsIcon } from '@hugeicons/react';
import { Menu01Icon } from '@hugeicons/core-free-icons';

export const DashboardPage = () => {
  const { user, logout, requiresPasswordChange } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mobileBreakpoint = 1024;
  const initialIsMobile = typeof window !== 'undefined' ? window.innerWidth < mobileBreakpoint : false;
  const [activeSection, setActiveSection] = useState('dashboard');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(initialIsMobile);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const {
    data: dashboardData,
    isLoading,
    isError,
    error
  } = useDashboardData();

  // Debug user object
  useEffect(() => {
    console.log('Current user object:', user);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    queryClient.prefetchQuery({
      queryKey: ['sprints'],
      queryFn: async () => {
        const response = await sprintService.getSprints();
        return response?.data?.data || [];
      }
    });
  }, [user?.id, queryClient]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < mobileBreakpoint;
      setIsMobile(mobile);

      if (mobile) {
        setIsSidebarCollapsed(true);
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-ground">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-ground flex flex-col">
      {/* Top Header - Donezo Style */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setIsMobileSidebarOpen((current) => !current)}
                className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label={isMobileSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                <HugeiconsIcon icon={Menu01Icon} size={20} color="currentColor" />
              </button>
              <img src="/krisban-logo.svg" alt="KrisBan" className="h-10 w-10 flex-shrink-0" />
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  KrisBan
                </h1>
                {activeSection !== 'dashboard' && (
                  <>
                    <span className="text-gray-400">|</span>
                    <span className="text-lg font-semibold text-dark-charcoal capitalize">
                      {activeSection === 'progress-reports' ? 'Progress Reports' : activeSection.replace('-', ' ')}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: Icons and User Profile */}
            <div className="flex items-center gap-4 relative">
              {/* User Avatar - Click for profile/settings */}
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 sm:gap-4 pl-3 sm:pl-4 border-l border-gray-200 hover:opacity-80 transition cursor-pointer"
              >
                <div className="w-10 h-10 bg-forest-green rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt={user?.fullName} className="w-full h-full object-cover" />
                  ) : (
                    (user?.fullName || user?.username || user?.email || 'U')[0].toUpperCase()
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-dark-charcoal">{user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.instituteEmail}</p>
                </div>
              </button>

              {/* Profile Dropdown */}
              <ProfileDropdown 
                isOpen={profileDropdownOpen} 
                onClose={() => setProfileDropdownOpen(false)} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1">
        {isMobile && isMobileSidebarOpen && (
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            aria-label="Close sidebar overlay"
          />
        )}

        {/* Sidebar */}
        <Sidebar 
          activeSection={activeSection} 
          setActiveSection={setActiveSection}
          userRole={user?.role}
          isCollapsed={isSidebarCollapsed}
          isMobile={isMobile}
          isMobileOpen={isMobileSidebarOpen}
          onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content Area - Add margin for fixed sidebar */}
        <main className={`flex-1 overflow-auto transition-[margin-left] duration-300 ease-in-out ${isMobile ? 'ml-0' : isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
          {isError && error && (
            <div className="m-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error.message || 'Failed to load dashboard'}
            </div>
          )}

          {/* Render Active Section */}
          {activeSection === 'dashboard' && <DashboardView dashboardData={dashboardData} userRole={user?.role} />}
          {activeSection === 'progress-reports' && <ProgressReportsView />}
          {activeSection === 'sprints' && <SprintsView userRole={user?.role} />}
          {activeSection === 'kanban' && <PlaceholderSection title="KanBan" icon="📊" />}
          {activeSection === 'documents' && <PlaceholderSection title="Documents" icon="📄" />}
          {activeSection === 'tickets' && <PlaceholderSection title="Tickets" icon="🎫" />}
        </main>
      </div>

      {/* Change Password Modal - Shows when user must change password */}
      {requiresPasswordChange && <ChangePasswordModal />}
    </div>
  );
};
