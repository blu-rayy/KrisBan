import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { dashboardService } from '../services/api';

export const DashboardPage = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PM-Suite</h1>
              <p className="text-gray-600">Project Management Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-gray-900 font-medium">{user?.name || user?.email}</p>
                <p className="text-sm text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {user?.role === 'ADMIN' ? (
              <>
                <SummaryCard
                  title="Total Projects"
                  value={dashboardData.summary.totalProjects}
                  icon="📊"
                />
                <SummaryCard
                  title="Total Cards"
                  value={dashboardData.summary.totalCards}
                  icon="🎯"
                />
                <SummaryCard
                  title="Avg Cards/Board"
                  value={dashboardData.summary.progressReport.averageCardsPerBoard}
                  icon="📈"
                />
                <SummaryCard
                  title="Active Boards"
                  value={dashboardData.summary.progressReport.activeBoards}
                  icon="✨"
                />
              </>
            ) : (
              <>
                <SummaryCard
                  title="Total Boards"
                  value={dashboardData.summary.totalBoards}
                  icon="📋"
                />
                <SummaryCard
                  title="Total Cards"
                  value={dashboardData.summary.totalCards}
                  icon="🎯"
                />
                <SummaryCard
                  title="As Owner"
                  value={dashboardData.summary.userInfo.asOwner}
                  icon="👤"
                />
                <SummaryCard
                  title="As Member"
                  value={dashboardData.summary.userInfo.asMember}
                  icon="👥"
                />
              </>
            )}
          </div>
        )}

        {/* Kanban Boards Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {user?.role === 'ADMIN' ? 'All Projects' : 'Your Boards'}
          </h2>

          {dashboardData?.boards && dashboardData.boards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.boards.map((board) => (
                <BoardCard key={board._id} board={board} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">
                {user?.role === 'ADMIN' ? 'No projects yet' : 'No boards assigned to you'}
              </p>
            </div>
          )}
        </div>

        {/* Admin Progress Report */}
        {user?.role === 'ADMIN' && dashboardData && (
          <AdminProgressReport data={dashboardData.summary.progressReport} />
        )}
      </main>
    </div>
  );
};

const SummaryCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="text-4xl">{icon}</div>
    </div>
  </div>
);

const BoardCard = ({ board }) => (
  <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
    <h3 className="text-lg font-bold text-gray-900 mb-2">{board.title}</h3>
    <p className="text-gray-600 text-sm mb-4">
      {board.description || 'No description'}
    </p>
    <div className="space-y-2 text-sm text-gray-600">
      <p>👤 Owner: {board.owner?.name || board.owner?.email}</p>
      <p>👥 Members: {board.members?.length || 0}</p>
      <p>📊 Columns: {board.columns?.length || 0}</p>
      <p>
        🎯 Cards:{' '}
        {board.columns?.reduce((sum, col) => sum + (col.cards?.length || 0), 0) || 0}
      </p>
    </div>
  </div>
);

const AdminProgressReport = ({ data }) => (
  <div className="mt-12 bg-white rounded-lg shadow p-8">
    <h3 className="text-2xl font-bold text-gray-900 mb-6">Progress Report</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <p className="text-gray-600 text-sm">Total Projects</p>
        <p className="text-2xl font-bold text-blue-600">{data.activeBoards}</p>
      </div>
      <div>
        <p className="text-gray-600 text-sm">High Priority Cards</p>
        <p className="text-2xl font-bold text-red-600">{data.cardsByPriority?.HIGH || 0}</p>
      </div>
      <div>
        <p className="text-gray-600 text-sm">Medium Priority Cards</p>
        <p className="text-2xl font-bold text-yellow-600">
          {data.cardsByPriority?.MEDIUM || 0}
        </p>
      </div>
    </div>
  </div>
);
