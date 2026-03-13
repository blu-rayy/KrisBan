import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardView } from '../components/dashboard/DashboardView';
import { ProgressReportsView } from '../components/progress-reports/ProgressReportsView';
import { SprintsView } from '../components/sprints/SprintsView';
import { SMEOutreachView } from '../components/sme-outreach/SMEOutreachView';
import { PlaceholderSection } from '../components/dashboard/PlaceholderSection';
import { KanbanView } from '../components/kanban/KanbanView';
import { TicketsListView } from '../components/kanban/TicketsListView';
import { ChangePasswordModal } from '../components/shared/ChangePasswordModal';
import { ProfileDropdown } from '../components/layout/ProfileDropdown';
import { SettingsView } from '../components/settings/SettingsView';
import { AdminDashboardView } from '../components/admin/AdminDashboardView';
import { useDashboardData } from '../hooks/useDashboardData';
import { useQueryClient } from '@tanstack/react-query';
import { sprintService } from '../services/sprintService';
import { emailsCrmService, fetchProgressReports } from '../services/api';
import { DarkModeToggle } from '../components/layout/DarkModeToggle';

const getEmailsCrmWarmBootCacheKey = (teamId) => `emailsCrmWarmBootCacheV1_team_${teamId ?? 'none'}`;

export const DashboardPage = () => {
  const { user, logout, requiresPasswordChange } = useContext(AuthContext);
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mobileBreakpoint = 1024;
  const initialIsMobile = typeof window !== 'undefined' ? window.innerWidth < mobileBreakpoint : false;
  const [activeSection, setActiveSection] = useState('dashboard');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(initialIsMobile);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const progressReportPageSize = 30;
  const progressReportFilters = useMemo(() => ({ sortBy: 'created_at', sortOrder: 'desc' }), []);
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

    const teamId = user?.teamId ?? null;

    queryClient.prefetchQuery({
      queryKey: ['sprints', teamId],
      queryFn: async () => {
        const response = await sprintService.getSprints();
        return response?.data?.data || [];
      }
    });

    queryClient.prefetchInfiniteQuery({
      queryKey: ['progressReports', teamId, progressReportFilters],
      queryFn: async ({ pageParam = 1 }) => {
        const data = await fetchProgressReports({
          ...progressReportFilters,
          page: pageParam,
          pageSize: progressReportPageSize,
          includeImages: false
        });

        return {
          data,
          pagination: {
            page: pageParam,
            pageSize: progressReportPageSize
          }
        };
      },
      initialPageParam: 1
    });

    if (user?.role === 'ADMIN') {
      Promise.all([
        emailsCrmService.getSmes(),
        emailsCrmService.getTemplates(),
        emailsCrmService.getPointPeople()
      ])
        .then(([smesResponse, templatesResponse, pointPeopleResponse]) => {
          const smes = smesResponse?.data?.data || [];
          const templates = templatesResponse?.data?.data || [];
          const pointPeople = pointPeopleResponse?.data?.data || [];
getEmailsCrmWarmBootCacheKey(user?.teamId ?? null)
          localStorage.setItem(
            EMAILS_CRM_WARM_BOOT_CACHE_KEY,
            JSON.stringify({
              smes,
              templates,
              pointPeople,
              updatedAt: new Date().toISOString()
            })
          );
        })
        .catch(() => {
          // Ignore prefetch errors; the Emails CRM page will load with its own request handling.
        });
    }
  }, [user?.id, queryClient, progressReportFilters]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    const handleAdminShortcut = (e) => {
      if (e.ctrlKey && e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setActiveSection('admin-dashboard');
      }
    };
    window.addEventListener('keydown', handleAdminShortcut);
    return () => window.removeEventListener('keydown', handleAdminShortcut);
  }, [user?.role]);

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
    <div className="min-h-screen bg-surface-ground dark:bg-dm-ground flex flex-col transition-colors duration-300">
      {/* Top Header */}
      <header className="bg-white dark:bg-dm-surface shadow-sm sticky top-0 z-40 h-20 transition-colors duration-300">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="flex items-center justify-between gap-6 w-full">
            {/* Left: Logo */}
            <button
              onClick={() => setActiveSection('dashboard')}
              className="flex items-center gap-3 flex-shrink-0 cursor-pointer"
            >
              <img src="/krisban-logo.svg" alt="KrisBan" className="h-10 w-10 flex-shrink-0" />
              <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                KrisBan
              </h1>
            </button>

            {/* Right: Dark mode toggle + User Profile */}
            <div className="flex items-center gap-3 relative">
              {/* Dark mode toggle */}
              <DarkModeToggle darkMode={darkMode} onToggle={toggleDarkMode} />

              {/* User Avatar */}
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 sm:gap-4 pl-3 sm:pl-4 border-l border-gray-200 dark:border-dm-border hover:opacity-90 active:scale-95 transition-all duration-150 cursor-pointer"
              >
                <div className={`w-10 h-10 bg-forest-green rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden ring-2 transition-all duration-150 ${profileDropdownOpen ? 'ring-forest-green ring-offset-2 ring-offset-white dark:ring-offset-dm-surface' : 'ring-transparent'}`}>
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt={user?.fullName} className="w-full h-full object-cover" />
                  ) : (
                    (user?.fullName || user?.username || user?.email || 'U')[0].toUpperCase()
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-dark-charcoal dark:text-dm-text">{user?.username}</p>
                  <p className="text-xs text-gray-500 dark:text-dm-muted">{user?.instituteEmail}</p>
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

        {/* Content Area */}
        <main className={`flex-1 overflow-auto scrollbar-hide transition-[margin-left] duration-300 ease-in-out ${isMobile ? 'ml-0' : isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
          {isError && error && (
            <div className="m-8 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error.message || 'Failed to load dashboard'}
            </div>
          )}

          {/* Render Active Section */}
          {activeSection === 'dashboard' && <DashboardView dashboardData={dashboardData} userRole={user?.role} teamName={user?.teamName} />}
          {activeSection === 'progress-reports' && <ProgressReportsView />}
          {activeSection === 'sprints' && <SprintsView userRole={user?.role} />}
          {activeSection === 'emails' && <SMEOutreachView />}
          {activeSection === 'kanban' && <KanbanView />}
          {activeSection === 'documents' && <PlaceholderSection title="Documents" icon="📄" />}
          {activeSection === 'tickets' && <TicketsListView />}
          {activeSection === 'settings' && <SettingsView />}
          {activeSection === 'admin-dashboard' && <AdminDashboardView />}
        </main>
      </div>

      {/* Change Password Modal - Shows when user must change password */}
      {requiresPasswordChange && <ChangePasswordModal />}
    </div>
  );
};
