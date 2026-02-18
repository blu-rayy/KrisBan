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
import { dashboardService } from '../services/api';

export const DashboardPage = () => {
  const { user, logout, requiresPasswordChange } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Debug user object
  useEffect(() => {
    console.log('Current user object:', user);
  }, [user]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getDashboard();
      setDashboardData(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
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
            {/* Left: Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                KrisBan
              </h1>
            </div>

            {/* Right: Icons and User Profile */}
            <div className="flex items-center gap-4 relative">
              {/* User Avatar - Click for profile/settings */}
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-4 pl-4 border-l border-gray-200 hover:opacity-80 transition cursor-pointer"
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
        {/* Sidebar */}
        <Sidebar 
          activeSection={activeSection} 
          setActiveSection={setActiveSection}
          userRole={user?.role}
          onLogout={handleLogout}
        />

        {/* Content Area - Add margin for fixed sidebar */}
        <main className="flex-1 overflow-auto ml-64">
          {error && (
            <div className="m-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
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
