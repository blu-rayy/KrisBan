import { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { ProgressReportForm } from './ProgressReportForm';
import { ProgressReportTable } from './ProgressReportTable';
import { ProgressReportViewOnly } from './ProgressReportViewOnly';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const ProgressReportsView = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('view');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressReports, setProgressReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    fetchProgressReport();
    fetchProgressReports();
    fetchAllUsers();
  }, []);

  const fetchProgressReport = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getProgressReport();
      setReportData(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load progress report');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressReports = async () => {
    try {
      setReportsLoading(true);
      const response = await dashboardService.getProgressReports();
      setProgressReports(response.data.data || []);
      setReportsError('');
    } catch (err) {
      setReportsError(err.response?.data?.message || 'Failed to load progress reports');
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      // For now, we'll use a simple fetch - in production, you might want a dedicated endpoint
      // This assumes there's an endpoint to get all users
      const response = await fetch('/api/dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        // Extract users from dashboard data - this is a workaround
        // In production, create a dedicated /api/users endpoint
        setAllUsers([user]); // Default to current user
      }
    } catch (err) {
      console.log('Failed to fetch users, using default');
      setAllUsers(user ? [user] : []);
    }
  };

  const handleSubmitProgressReport = async (formData) => {
    try {
      setSubmitting(true);
      const response = await dashboardService.createProgressReport(formData);
      setProgressReports([response.data.data, ...progressReports]);
      setReportsError('');
      // Show success message
      alert('Progress report entry created successfully!');
    } catch (err) {
      setReportsError(err.response?.data?.message || 'Failed to create progress report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProgressReport = async (reportId) => {
    try {
      await dashboardService.deleteProgressReport(reportId);
      setProgressReports(progressReports.filter(r => r.id !== reportId));
      setReportsError('');
      alert('Progress report deleted successfully!');
    } catch (err) {
      setReportsError(err.response?.data?.message || 'Failed to delete progress report');
    }
  };

  const handleUpdateProgressReport = async (reportId, formData) => {
    try {
      const response = await dashboardService.updateProgressReport(reportId, formData);
      setProgressReports(progressReports.map(r => r.id === reportId ? response.data.data : r));
      setReportsError('');
      alert('Progress report updated successfully!');
    } catch (err) {
      setReportsError(err.response?.data?.message || 'Failed to update progress report');
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('view')}
          className={`px-6 py-3 font-medium border-b-2 transition ${
            activeTab === 'view'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          👁️ View Entries
        </button>
        <button
          onClick={() => setActiveTab('sprint-tracker')}
          className={`px-6 py-3 font-medium border-b-2 transition ${
            activeTab === 'sprint-tracker'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📋 Sprint Tracker
        </button>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setActiveTab('projects-overview')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeTab === 'projects-overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Projects Overview
          </button>
        )}
      </div>

      {/* View Entries Tab */}
      {activeTab === 'view' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Progress Report Entries</h2>
            <p className="text-gray-600">View all team progress entries</p>
          </div>

          <ProgressReportViewOnly
            reports={progressReports}
            loading={reportsLoading}
            error={reportsError}
          />
        </div>
      )}

      {/* Sprint Tracker Tab */}
      {activeTab === 'sprint-tracker' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sprint Progress Tracker</h2>
            <p className="text-gray-600">Record your daily progress and task completion</p>
          </div>

          {/* Form */}
          <ProgressReportForm
            members={allUsers.length > 0 ? allUsers : [user].filter(Boolean)}
            onSubmit={handleSubmitProgressReport}
            loading={submitting}
          />

          {/* Table */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Entries</h3>
            <ProgressReportTable
              reports={progressReports}
              loading={reportsLoading}
              error={reportsError}
              onDelete={handleDeleteProgressReport}
              onUpdate={handleUpdateProgressReport}
              currentUserId={user?.id}
              userRole={user?.role}
            />
          </div>
        </div>
      )}

      {/* Projects Overview Tab (Admin Only) */}
      {activeTab === 'projects-overview' && reportData && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Projects Overview</h2>
            <p className="text-gray-600">Comprehensive overview of all active projects</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Projects</p>
                  <p className="text-3xl font-bold text-gray-900">{reportData.totalBoards}</p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Tasks</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reportData.boardsList.reduce((sum, board) => sum + board.cardCount, 0)}
                  </p>
                </div>
                <div className="text-4xl">🎯</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Avg Tasks/Project</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reportData.totalBoards > 0
                      ? (
                          reportData.boardsList.reduce((sum, board) => sum + board.cardCount, 0) /
                          reportData.totalBoards
                        ).toFixed(1)
                      : 0}
                  </p>
                </div>
                <div className="text-4xl">📈</div>
              </div>
            </div>
          </div>

          {/* Cards by Priority */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Priority</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-3xl">🔴</div>
                <div>
                  <p className="text-sm text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-red-600">{reportData.cardsByPriority.HIGH}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-3xl">🟡</div>
                <div>
                  <p className="text-sm text-gray-600">Medium Priority</p>
                  <p className="text-2xl font-bold text-yellow-600">{reportData.cardsByPriority.MEDIUM}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-3xl">🟢</div>
                <div>
                  <p className="text-sm text-gray-600">Low Priority</p>
                  <p className="text-2xl font-bold text-green-600">{reportData.cardsByPriority.LOW}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Project</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Owner</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Members</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tasks</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Columns</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.boardsList.map(board => (
                    <tr key={board.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{board.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{board.owner}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {board.memberCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {board.cardCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {board.columnCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-gray-500 text-right">
            Last updated: {new Date(reportData.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      {loading && activeTab === 'projects-overview' && (
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Loading progress report...</div>
        </div>
      )}

      {error && activeTab === 'projects-overview' && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};
