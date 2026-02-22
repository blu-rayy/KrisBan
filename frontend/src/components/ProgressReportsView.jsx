import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/api';
import { ProgressReportForm } from './ProgressReportForm';
import { ProgressReportTable } from './ProgressReportTable';
import { ProgressReportViewOnly } from './ProgressReportViewOnly';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useInfiniteProgressReports } from '../hooks/useProgressReports';
import { HugeiconsIcon } from '@hugeicons/react';
import { ChartBarLineIcon, NoteAddIcon, Task01Icon } from '@hugeicons/core-free-icons';

export const ProgressReportsView = () => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('view');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const progressReportPageSize = 30;
  const progressReportFilters = useMemo(() => ({ sortBy: 'created_at', sortOrder: 'desc' }), []);
  const progressReportsQueryKey = useMemo(() => ['progressReports', progressReportFilters], [progressReportFilters]);
  const {
    data: progressReportsData,
    isLoading: reportsLoading,
    isError: reportsIsError,
    error: reportsQueryError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  } = useInfiniteProgressReports(progressReportFilters, progressReportPageSize);

  const progressReports = useMemo(
    () => progressReportsData?.pages?.flatMap((page) => page?.data || []) || [],
    [progressReportsData]
  );

  const invalidateProgressRelatedQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['progressReports'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboardRecentActivity'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboardLastWeekProgressStats'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] }),
      queryClient.invalidateQueries({ queryKey: ['sprints'] })
    ]);
  };

  const buildUsersFromReports = (reports = []) => {
    if (user?.role !== 'ADMIN') {
      return user ? [user] : [];
    }

    const uniqueUsers = new Map();
    reports.forEach((report) => {
      if (report.memberId && !uniqueUsers.has(report.memberId)) {
        uniqueUsers.set(report.memberId, {
          username: report.memberName,
          name: report.memberName,
          email: report.memberEmail
        });
      }
    });

    const usersList = Array.from(uniqueUsers.values());
    if (user && !usersList.find((entry) => String(entry.id) === String(user.id))) {
      usersList.unshift({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email
      });
    }

    return usersList;
  };

  useEffect(() => {
    if (activeTab === 'tickets-overview' && user?.role === 'ADMIN' && !reportData && !loading) {
      fetchProgressReport();
    }
  }, [activeTab, user?.role, reportData, loading]);


  const allUsers = useMemo(() => buildUsersFromReports(progressReports), [progressReports, user?.id, user?.role]);

  const reportsError = reportsIsError
    ? (reportsQueryError?.message || 'Failed to load progress reports')
    : '';

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

  const handleSubmitProgressReport = async (formData) => {
    try {
      setSubmitting(true);
      const response = await dashboardService.createProgressReport(formData);
      queryClient.setQueryData(progressReportsQueryKey, (current) => {
        if (!current?.pages?.length) {
          return current;
        }

        const firstPage = current.pages[0] || { data: [], pagination: { page: 1, pageSize: progressReportPageSize } };
        return {
          ...current,
          pages: [
            {
              ...firstPage,
              data: [response.data.data, ...(firstPage.data || [])]
            },
            ...current.pages.slice(1)
          ]
        };
      });
      await invalidateProgressRelatedQueries();
      // Show success message
      alert('Progress report entry created successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create progress report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProgressReport = async (reportId) => {
    try {
      await dashboardService.deleteProgressReport(reportId);
      queryClient.setQueryData(progressReportsQueryKey, (current) => {
        if (!current?.pages?.length) {
          return current;
        }

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            data: (page.data || []).filter((report) => report.id !== reportId)
          }))
        };
      });
      await invalidateProgressRelatedQueries();
      alert('Progress report deleted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete progress report');
    }
  };

  const handleUpdateProgressReport = async (reportId, formData) => {
    try {
      const response = await dashboardService.updateProgressReport(reportId, formData);
      queryClient.setQueryData(progressReportsQueryKey, (current) => {
        if (!current?.pages?.length) {
          return current;
        }

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            data: (page.data || []).map((report) => (report.id === reportId ? response.data.data : report))
          }))
        };
      });
      await invalidateProgressRelatedQueries();
      alert('Progress report updated successfully!');
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Tab Navigation - Forest Gradient Theme */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('view')}
          className={`px-6 py-3 font-medium border-b-2 transition-all duration-300 ${
            activeTab === 'view'
              ? 'border-forest-green text-forest-green'
              : 'border-transparent text-gray-600 hover:text-dark-charcoal'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <HugeiconsIcon icon={Task01Icon} size={18} color="currentColor" />
            <span>Entries</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('sprint-tracker')}
          className={`px-6 py-3 font-medium border-b-2 transition-all duration-300 ${
            activeTab === 'sprint-tracker'
              ? 'border-forest-green text-forest-green'
              : 'border-transparent text-gray-600 hover:text-dark-charcoal'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <HugeiconsIcon icon={NoteAddIcon} size={18} color="currentColor" />
            <span>Add Entry</span>
          </span>
        </button>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setActiveTab('tickets-overview')}
            className={`px-6 py-3 font-medium border-b-2 transition-all duration-300 ${
              activeTab === 'tickets-overview'
                ? 'border-forest-green text-forest-green'
                : 'border-transparent text-gray-600 hover:text-dark-charcoal'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <HugeiconsIcon icon={ChartBarLineIcon} size={18} color="currentColor" />
              <span>Tickets Overview</span>
            </span>
          </button>
        )}
      </div>

      {/* View Entries Tab */}
      {activeTab === 'view' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-dark-charcoal">Sprint Entries</h2>
            <p className="text-gray-600">View all team progress entries</p>
          </div>

          <ProgressReportViewOnly
            reports={progressReports}
            loading={reportsLoading}
            error={reportsError}
            onDelete={handleDeleteProgressReport}
            onUpdate={handleUpdateProgressReport}
            currentUserId={user?.id}
            userRole={user?.role}
          />

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sprint Tracker Tab */}
      {activeTab === 'sprint-tracker' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-dark-charcoal">Add Sprint Entry</h2>
            <p className="text-gray-600">Record your daily progress and task completion</p>
          </div>

          {/* Form */}
          <ProgressReportForm
            members={allUsers.length > 0 ? allUsers : [user].filter(Boolean)}
            reports={progressReports}
            onSubmit={handleSubmitProgressReport}
            loading={submitting}
            userRole={user?.role}
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

            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tickets Overview Tab (Admin Only) */}
      {activeTab === 'tickets-overview' && reportData && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tickets Overview</h2>
            <p className="text-gray-600">Comprehensive overview of all active tickets</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Tickets</p>
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
                  <p className="text-gray-600 text-sm font-medium">Avg Tasks/Ticket</p>
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

          {/* Tickets Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Ticket Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ticket</th>
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
      )}}

      {loading && activeTab === 'tickets-overview' && (
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Loading progress report...</div>
        </div>
      )}

      {error && activeTab === 'tickets-overview' && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};
