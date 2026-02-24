import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/api';
import { ProgressReportForm } from './ProgressReportForm';
import { ProgressReportTable } from './ProgressReportTable';
import { ProgressReportViewOnly } from './ProgressReportViewOnly';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useInfiniteProgressReports } from '../hooks/useProgressReports';
import { generateDailyAccomplishmentReport } from '../utils/geminiReportGenerator';
import { HugeiconsIcon } from '@hugeicons/react';
import { Ticket01Icon, Edit02Icon, DocumentAttachmentIcon, HelpCircleIcon } from '@hugeicons/core-free-icons';

export const ProgressReportsView = () => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('view');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState('');
  const [generatedSummaries, setGeneratedSummaries] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const estimatedDuration = 25; // seconds
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

  // Timer for report generation
  useEffect(() => {
    let interval;
    if (generatingReport) {
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [generatingReport]);

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

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      setReportError('');
      setGeneratedSummaries(null);
      
      // Hardcoded to February 16, 2026
      const report = await generateDailyAccomplishmentReport(
        '2026-02-16',
        import.meta.env.VITE_API_URL,
        localStorage.getItem('token')
      );
      
      setGeneratedSummaries({
        date: 'February 16, 2026',
        report
      });
    } catch (err) {
      const errorMsg = err.message || 'Failed to generate report';
      setReportError(errorMsg);
      
      // Show modal if Gemini Nano is not available
      if (errorMsg.includes('Gemini Nano') || errorMsg.includes('not available')) {
        setShowErrorModal(true);
      }
    } finally {
      setGeneratingReport(false);
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
            <HugeiconsIcon icon={Ticket01Icon} size={18} />
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
            <HugeiconsIcon icon={Edit02Icon} size={18} />
            <span>Add Entry</span>
          </span>
        </button>
        {user?.role === 'ADMIN' && (
          <>
            <button
              onClick={() => setActiveTab('generate-report')}
              className={`px-6 py-3 font-medium border-b-2 transition-all duration-300 ${
                activeTab === 'generate-report'
                  ? 'border-forest-green text-forest-green'
                  : 'border-transparent text-gray-600 hover:text-dark-charcoal'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <HugeiconsIcon icon={DocumentAttachmentIcon} size={18} />
                <span>Generate Report</span>
              </span>
            </button>
          </>
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

      {/* Generate Report Tab */}
      {activeTab === 'generate-report' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-50 to-forest-light rounded-xl shadow-lg p-8 border border-forest-green border-opacity-20">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-4xl font-bold text-forest-green">Daily Report Generator</h2>
              </div>
              <p className="text-gray-700 ml-1 leading-relaxed">
                Generate a professionally formatted daily accomplishment report for February 16, 2026 powered by Gemini Nano AI.
              </p>
            </div>
            
            {reportError && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 flex items-start gap-3">
                <span className="text-xl mt-1">⚠️</span>
                <div>
                  <p className="font-semibold">Generation Error</p>
                  <p className="text-sm mt-1">{reportError}</p>
                </div>
              </div>
            )}

            <div className="mb-8">
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-lg transition duration-300 inline-flex items-center gap-3 text-lg shadow-lg hover:shadow-xl hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <HugeiconsIcon icon={DocumentAttachmentIcon} size={24} />
                <span>
                  {generatingReport 
                    ? 'Processing...' 
                    : 'Generate Report (Feb 16)'}
                </span>
              </button>
              {generatingReport && (
                <div className="mt-4 space-y-2">
                  <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-3 bg-gradient-to-r from-emerald-500 to-forest-green rounded-full transition-all duration-500"
                      style={{width: `${Math.min(100, (elapsedTime / estimatedDuration) * 100)}%`}}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">Generating your report...</p>
                </div>
              )}
            </div>



            {/* Generated Report Output */}
            {generatedSummaries && (
              <div className="mt-8 pt-8 border-t-2 border-forest-green border-opacity-20">
                <h3 className="text-2xl font-bold text-forest-green mb-6 flex items-center gap-2">
                  <span>📄</span>
                  Generated Report — {generatedSummaries.date}
                </h3>
                <div className="bg-white border-2 border-emerald-200 rounded-lg p-6 mb-6 shadow-sm">
                  <pre className="text-dark-charcoal font-mono text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {generatedSummaries.report}
                  </pre>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSummaries.report);
                      alert('✓ Report copied to clipboard!');
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-forest-green hover:shadow-lg text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-2"
                  >
                    <span>📋</span> Copy Report
                  </button>
                  <button
                    onClick={() => {
                      const element = document.createElement('a');
                      const file = new Blob([generatedSummaries.report], {type: 'text/plain'});
                      element.href = URL.createObjectURL(file);
                      element.download = `daily-report-february-16-2026.txt`;
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-2"
                  >
                    <span>⬇️</span> Download
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Info */}
          <div className="text-center text-xs text-gray-400 px-4 py-3">
            <p className="font-mono flex items-center justify-center gap-1">
              <HugeiconsIcon icon={HelpCircleIcon} size={14} /> Requires Chrome Canary with Prompt API enabled at <span className="font-semibold">chrome://flags/#prompt-api</span>
            </p>
          </div>
        </div>
      )}

      {/* Error Modal - Gemini Nano Not Available */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔧</div>
              <h3 className="text-2xl font-bold text-dark-charcoal mb-2">Gemini Nano Not Available</h3>
              <p className="text-gray-600">The AI report generator requires Chrome Canary with Gemini Nano enabled.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-900">
              <p className="font-semibold mb-2">✓ Steps to enable:</p>
              <ol className="space-y-2 list-decimal list-inside">
                <li>Open <strong>Chrome Canary</strong></li>
                <li>Visit <code className="bg-blue-100 px-2 py-1 rounded">chrome://flags/#prompt-api</code></li>
                <li>Set <strong>Prompt API</strong> to "Enabled"</li>
                <li>Restart Chrome Canary</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowErrorModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition duration-200"
              >
                Close
              </button>
              <a
                href="https://developers.google.com/chrome/prompts-api"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-forest-green hover:shadow-lg text-white font-semibold rounded-lg transition duration-200 text-center"
              >
                Documentation
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tickets Overview Tab (Admin Only) - REMOVED */}
    </div>
  );
};
