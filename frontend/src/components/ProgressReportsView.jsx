import { useState, useEffect, useMemo, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dashboardService, weeklyReportService } from '../services/api';
import { ProgressReportForm } from './ProgressReportForm';
import { ProgressReportTable } from './ProgressReportTable';
import { ProgressReportViewOnly } from './ProgressReportViewOnly';
import { generateFormattedReportWithGemini } from '../utils/geminiReportGenerator';
import { AuthContext } from '../context/AuthContext';
import { useInfiniteProgressReports } from '../hooks/useProgressReports';
import { HugeiconsIcon } from '@hugeicons/react';
import { Ticket01Icon, Edit02Icon, DocumentAttachmentIcon, HelpCircleIcon } from '@hugeicons/core-free-icons';

const normalizeMemberName = (name) => {
  if (!name) return 'UNKNOWN';
  const first = String(name).toLowerCase().split(' ')[0];
  const map = {
    kristian: 'KRISTIAN',
    kris: 'KRISTIAN',
    angel: 'ANGEL',
    michael: 'MICHAEL',
    marianne: 'MARIANNE'
  };
  return map[first] || String(name).toUpperCase();
};

export const ProgressReportsView = () => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('view');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [generatingReport, setGeneratingReport] = useState(false);
  const [savingWeekly, setSavingWeekly] = useState(false);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [reportError, setReportError] = useState('');
  const [generationMessage, setGenerationMessage] = useState('');
  const [exportWarning, setExportWarning] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  const [weeklyReports, setWeeklyReports] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [weekDetailsByWeek, setWeekDetailsByWeek] = useState({});
  const [loadingWeekDetailsByWeek, setLoadingWeekDetailsByWeek] = useState({});
  const [expandedWeeks, setExpandedWeeks] = useState({});

  const [reportingStartDate, setReportingStartDate] = useState('');
  const [reportingEndDate, setReportingEndDate] = useState('');
  const [signatoryDate, setSignatoryDate] = useState('');
  const [reportingDateLabel, setReportingDateLabel] = useState('');
  const [singleDayMode, setSingleDayMode] = useState(false);
  const [singleDate, setSingleDate] = useState('');
  const [generatedRows, setGeneratedRows] = useState([]);

  const estimatedDuration = 25;
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

  const weeklyReportsSorted = useMemo(
    () => [...weeklyReports].sort((a, b) => Number(b.reportWeek) - Number(a.reportWeek)),
    [weeklyReports]
  );

  const selectedWeekDetail = selectedWeek ? weekDetailsByWeek[selectedWeek] : null;

  const canGenerate = useMemo(() => {
    if (!selectedWeek || generatingReport) {
      return false;
    }

    if (singleDayMode) {
      return Boolean(singleDate);
    }

    return Boolean(reportingStartDate && reportingEndDate);
  }, [selectedWeek, generatingReport, singleDayMode, singleDate, reportingStartDate, reportingEndDate]);

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

  const allUsers = useMemo(() => buildUsersFromReports(progressReports), [progressReports, user?.id, user?.role]);

  const reportsError = reportsIsError
    ? (reportsQueryError?.message || 'Failed to load progress reports')
    : '';

  const extractApiErrorMessage = async (error, fallback) => {
    const responseData = error?.response?.data;

    if (responseData?.message) {
      return responseData.message;
    }

    if (responseData instanceof Blob) {
      try {
        const text = await responseData.text();
        const parsed = JSON.parse(text);
        if (parsed?.message) {
          return parsed.message;
        }
      } catch (_blobParseError) {
        return fallback;
      }
    }

    return fallback;
  };

  const applyWeekDetail = (detail) => {
    if (!detail) return;

    setReportingStartDate(detail.weekStartDate || '');
    setReportingEndDate(detail.weekEndDate || '');
    setSignatoryDate(detail.signatoryDate || '');
    setReportingDateLabel(detail.reportingDate || '');
  };

  const fetchWeekDetail = async (weekNumber, updateFormState = false) => {
    if (!weekNumber) return null;

    if (weekDetailsByWeek[weekNumber]) {
      if (updateFormState) {
        applyWeekDetail(weekDetailsByWeek[weekNumber]);
      }
      return weekDetailsByWeek[weekNumber];
    }

    try {
      setLoadingWeekDetailsByWeek((prev) => ({ ...prev, [weekNumber]: true }));
      const response = await weeklyReportService.getByWeek(weekNumber);
      const detail = response?.data?.data;

      setWeekDetailsByWeek((prev) => ({ ...prev, [weekNumber]: detail }));
      if (updateFormState) {
        applyWeekDetail(detail);
      }

      return detail;
    } catch (err) {
      setReportError(err.response?.data?.message || 'Failed to load selected week details');
      return null;
    } finally {
      setLoadingWeekDetailsByWeek((prev) => ({ ...prev, [weekNumber]: false }));
    }
  };

  const loadWeeklyReports = async (preserveSelection = true) => {
    try {
      setLoadingWeekly(true);
      const response = await weeklyReportService.list();
      const weeks = response?.data?.data || [];
      setWeeklyReports(weeks);

      if (weeks.length === 0) {
        setSelectedWeek('');
        return;
      }

      const sorted = [...weeks].sort((a, b) => Number(b.reportWeek) - Number(a.reportWeek));
      const targetWeek = preserveSelection && selectedWeek ? selectedWeek : String(sorted[0].reportWeek);
      setSelectedWeek(targetWeek);
      await fetchWeekDetail(targetWeek, true);
    } catch (err) {
      setReportError(err.response?.data?.message || 'Failed to load weekly reports');
    } finally {
      setLoadingWeekly(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tickets-overview' && user?.role === 'ADMIN' && !reportData && !loading) {
      fetchProgressReport();
    }
  }, [activeTab, user?.role, reportData, loading]);

  useEffect(() => {
    if (activeTab === 'generate-report' && user?.role === 'ADMIN') {
      loadWeeklyReports(false);
    }
  }, [activeTab, user?.role]);

  useEffect(() => {
    let interval;
    if (generatingReport) {
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [generatingReport]);

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
  };

  const handleSelectWeek = async (weekNumber) => {
    setSelectedWeek(weekNumber);
    setGeneratedRows([]);
    setGenerationMessage('');
    setReportError('');

    await fetchWeekDetail(weekNumber, true);
  };

  const handleGenerateReport = async () => {
    if (!canGenerate) return;

    try {
      setGeneratingReport(true);
      setReportError('');
      setGenerationMessage('');
      setGeneratedRows([]);

      const payload = {
        reportWeek: Number(selectedWeek),
        ...(singleDayMode
          ? { singleDate }
          : {
              startDate: reportingStartDate,
              endDate: reportingEndDate
            })
      };

      const response = await weeklyReportService.generateDraft(payload);
      const data = response?.data?.data;

      if (!data?.canGenerate) {
        setReportError(data?.message || 'No entries found for the selected dates.');
        return;
      }

      const rows = data?.generatedRows || [];
      const generatedWithGemini = [];

      for (const row of rows) {
        const rowDate = row.rowDate;
        const dateObj = new Date(`${rowDate}T00:00:00`);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });

        let reportsForGemini = Array.isArray(row.sourceReports) ? row.sourceReports : [];

        if (reportsForGemini.length === 0 && rowDate) {
          const dailyResponse = await dashboardService.getProgressReports({ date: rowDate, includeImages: false });
          const dailyReports = dailyResponse?.data?.data || [];

          reportsForGemini = dailyReports
            .map((report) => ({
              memberName: normalizeMemberName(report.memberName || report.memberFullName || report.username),
              taskDone: report.taskDone || report.task_done || ''
            }))
            .filter((item) => String(item.taskDone || '').trim());
        }

        const geminiReport = await generateFormattedReportWithGemini(reportsForGemini, formattedDate);
        generatedWithGemini.push({
          ...row,
          rowActivity: geminiReport
        });
      }

      setGenerationMessage(`${data?.message || 'Draft generated successfully.'} Generated with Gemini Nano.`);
      setGeneratedRows(generatedWithGemini);

      if (data?.startDate && !singleDayMode) {
        setReportingStartDate(data.startDate);
      }
      if (data?.endDate && !singleDayMode) {
        setReportingEndDate(data.endDate);
      }
      if (data?.signatoryDate) {
        setSignatoryDate(data.signatoryDate);
      }
      if (data?.reportingDate) {
        setReportingDateLabel(data.reportingDate);
      }
    } catch (err) {
      setReportError(err?.message || err.response?.data?.message || 'Failed to generate weekly draft with Gemini Nano');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleRowDateChange = (rowNumber, newDate) => {
    setGeneratedRows((currentRows) =>
      currentRows.map((row) => (row.rowNumber === rowNumber ? { ...row, rowDate: newDate, rowDateDisplay: newDate } : row))
    );
  };

  const handleRowActivityChange = (rowNumber, rowActivity) => {
    setGeneratedRows((currentRows) =>
      currentRows.map((row) => (row.rowNumber === rowNumber ? { ...row, rowActivity } : row))
    );
  };

  const handleSaveWeeklyReport = async () => {
    if (!selectedWeek || generatedRows.length === 0) return;

    try {
      setSavingWeekly(true);
      setExportWarning('');

      const payload = {
        entries: generatedRows.map((row) => ({
          rowNumber: row.rowNumber,
          rowDate: row.rowDate,
          rowActivity: row.rowActivity,
          hasSourceEntries: row.hasSourceEntries
        })),
        startDate: singleDayMode ? singleDate : reportingStartDate,
        endDate: singleDayMode ? singleDate : reportingEndDate,
        signatoryDate
      };

      const response = await weeklyReportService.saveDraft(Number(selectedWeek), payload);
      const savedWeek = response?.data?.data;

      setWeekDetailsByWeek((prev) => ({
        ...prev,
        [selectedWeek]: savedWeek
      }));

      setGenerationMessage('Saved weekly report draft successfully.');
      await loadWeeklyReports(true);

      try {
        const pdfResponse = await weeklyReportService.exportPdf(Number(selectedWeek));
        const fileBlob = new Blob([pdfResponse.data], { type: 'application/pdf' });
        const objectUrl = window.URL.createObjectURL(fileBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = objectUrl;
        downloadLink.download = `A Priori_W${selectedWeek}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(objectUrl);
        alert('Weekly report saved and PDF downloaded successfully!');
      } catch (exportErr) {
        const exportMessage = await extractApiErrorMessage(
          exportErr,
          'PDF export failed, but your weekly report was saved.'
        );

        try {
          const docxResponse = await weeklyReportService.exportDocx(Number(selectedWeek));
          const docxBlob = new Blob([docxResponse.data], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          });
          const docxUrl = window.URL.createObjectURL(docxBlob);
          const docxLink = document.createElement('a');
          docxLink.href = docxUrl;
          docxLink.download = `A Priori_W${selectedWeek}.docx`;
          document.body.appendChild(docxLink);
          docxLink.click();
          document.body.removeChild(docxLink);
          window.URL.revokeObjectURL(docxUrl);

          setExportWarning(`${exportMessage} Downloaded DOCX fallback instead.`);
          alert('Weekly report saved. PDF unavailable, so DOCX was downloaded instead.');
        } catch (_docxErr) {
          setExportWarning(exportMessage);
          alert('Weekly report saved successfully, but export failed.');
        }
      }
    } catch (err) {
      setReportError(err.response?.data?.message || 'Failed to save weekly report');
    } finally {
      setSavingWeekly(false);
    }
  };

  const handleToggleExpandedWeek = async (weekNumber) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNumber]: !prev[weekNumber]
    }));

    if (!weekDetailsByWeek[weekNumber]) {
      await fetchWeekDetail(weekNumber, false);
    }
  };

  const pageHeading =
    activeTab === 'sprint-tracker'
      ? {
          title: 'Add Sprint Entry',
          description: 'Record your daily progress and task completion'
        }
      : activeTab === 'generate-report'
      ? {
          title: 'Report Generator',
          description:
            'Select a reporting week, generate daily draft rows from existing entries, edit if needed, then save.'
        }
      : {
          title: 'Sprint Entries',
          description: 'View all team progress entries'
        };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-charcoal">{pageHeading.title}</h2>
        <p className="text-gray-600 text-sm sm:text-base lg:text-lg">{pageHeading.description}</p>
      </div>

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
        )}
      </div>

      {activeTab === 'view' && (
        <div className="space-y-6">
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

      {activeTab === 'sprint-tracker' && (
        <div className="space-y-6">
          <ProgressReportForm
            members={allUsers.length > 0 ? allUsers : [user].filter(Boolean)}
            reports={progressReports}
            onSubmit={handleSubmitProgressReport}
            loading={submitting}
            userRole={user?.role}
          />

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

      {activeTab === 'generate-report' && user?.role === 'ADMIN' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 space-y-4">
            {reportError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {reportError}
              </div>
            )}

            {generationMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
                {generationMessage}
              </div>
            )}

            {exportWarning && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
                {exportWarning}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reporting Week</label>
                <select
                  value={selectedWeek}
                  onChange={(event) => handleSelectWeek(event.target.value)}
                  disabled={loadingWeekly}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select week</option>
                  {weeklyReportsSorted.map((week) => (
                    <option key={week.id || week.reportWeek} value={String(week.reportWeek)}>
                      Week {week.reportWeek}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Signatory Date</label>
                <input
                  type="date"
                  value={signatoryDate}
                  onChange={(event) => setSignatoryDate(event.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={reportingStartDate}
                  onChange={(event) => setReportingStartDate(event.target.value)}
                  disabled={singleDayMode}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={reportingEndDate}
                  onChange={(event) => setReportingEndDate(event.target.value)}
                  disabled={singleDayMode}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100"
                />
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-semibold">Reporting Date:</span> {reportingDateLabel || '—'}
            </div>

            <div className="flex flex-col gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={singleDayMode}
                  onChange={(event) => {
                    setSingleDayMode(event.target.checked);
                    setGeneratedRows([]);
                    setGenerationMessage('');
                    setReportError('');
                  }}
                />
                Generate single day only
              </label>

              {singleDayMode && (
                <div className="max-w-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Single Date</label>
                  <input
                    type="date"
                    value={singleDate}
                    onChange={(event) => setSingleDate(event.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}
            </div>

            <div>
              <button
                onClick={handleGenerateReport}
                disabled={!canGenerate}
                className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-lg transition duration-300 inline-flex items-center gap-3 text-lg shadow-lg hover:shadow-xl hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <HugeiconsIcon icon={DocumentAttachmentIcon} size={24} />
                <span>{generatingReport ? 'Processing...' : 'Generate Draft'}</span>
              </button>

              {generatingReport && (
                <div className="mt-4 space-y-2">
                  <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (elapsedTime / estimatedDuration) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">Generating draft rows...</p>
                </div>
              )}
            </div>

            {generatedRows.length > 0 && (
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Generated Rows (Editable)</h3>

                {generatedRows.map((row) => (
                  <div key={row.rowNumber} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                      <div className="font-semibold text-gray-700">Row {row.rowNumber}</div>
                      <input
                        type="date"
                        value={row.rowDate || ''}
                        onChange={(event) => handleRowDateChange(row.rowNumber, event.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <div className="text-sm text-gray-500">Entries: {row.entryCount || 0}</div>
                    </div>

                    <textarea
                      value={row.rowActivity || ''}
                      onChange={(event) => handleRowActivityChange(row.rowNumber, event.target.value)}
                      rows={6}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                    />
                  </div>
                ))}

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveWeeklyReport}
                    disabled={savingWeekly}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingWeekly ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Saved Weekly Reports</h3>

            {weeklyReportsSorted.length === 0 && (
              <p className="text-sm text-gray-500">No saved weekly reports yet.</p>
            )}

            {weeklyReportsSorted.map((week) => {
              const weekNumber = String(week.reportWeek);
              const isExpanded = Boolean(expandedWeeks[weekNumber]);
              const detail = weekDetailsByWeek[weekNumber];
              const loadingDetail = Boolean(loadingWeekDetailsByWeek[weekNumber]);

              return (
                <div key={week.id || weekNumber} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => handleToggleExpandedWeek(weekNumber)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">Week {week.reportWeek}</p>
                      <p className="text-sm text-gray-500">{week.reportingDate || 'No reporting date'}</p>
                    </div>
                    <span className="text-sm text-gray-500">{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 text-sm text-gray-700 space-y-2">
                      {loadingDetail && <p>Loading details...</p>}

                      {!loadingDetail && (
                        <>
                          <p>
                            <span className="font-semibold">Reporting Date:</span> {detail?.reportingDate || week.reportingDate || '—'}
                          </p>
                          <p>
                            <span className="font-semibold">Signatory Date:</span> {detail?.signatoryDate || week.signatoryDate || '—'}
                          </p>
                          <p>
                            <span className="font-semibold">Status:</span> {detail?.status || week.status || '—'}
                          </p>

                          {(detail?.entries || []).length > 0 && (
                            <div className="pt-2 space-y-2">
                              {detail.entries.map((entry) => (
                                <div key={entry.id || `${weekNumber}-${entry.rowNumber}`} className="bg-gray-50 rounded p-2 border border-gray-200">
                                  <p className="font-semibold">Row {entry.rowNumber} — {entry.rowDate || '—'}</p>
                                  <p className="text-xs text-gray-600 whitespace-pre-wrap">{entry.rowActivity || '(empty)'}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center text-xs text-gray-400 px-4 py-3">
            <p className="font-mono flex items-center justify-center gap-1">
              <HugeiconsIcon icon={HelpCircleIcon} size={14} /> Generate is enabled only after required week/date fields are filled.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
