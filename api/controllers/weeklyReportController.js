import { supabase } from '../config/database.js';
import WeeklyReport from '../models/WeeklyReport.js';
import { exportWeeklyReportPdf, renderWeeklyReportDocxBuffer } from '../utils/weeklyReportExporter.js';
import { formatMMDDYYYY, formatReportingDateRange, parseISODate } from '../utils/weeklyReportDates.js';

const isISODate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

const buildDateRange = (startDateISO, endDateISO) => {
  const startDate = parseISODate(startDateISO);
  const endDate = parseISODate(endDateISO);

  if (endDate < startDate) {
    return [];
  }

  const dates = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
};

const mapDisplayMemberName = (fullName, username) => {
  const source = String(fullName || username || '').trim();
  if (!source) return 'UNKNOWN';

  const firstName = source.split(' ')[0].toUpperCase();
  const aliasMap = {
    KRIS: 'KRISTIAN',
    KRISTIAN: 'KRISTIAN',
    ANGEL: 'ANGEL',
    MICHAEL: 'MICHAEL',
    MARIANNE: 'MARIANNE'
  };

  return aliasMap[firstName] || firstName;
};

const fetchUsersMapByIds = async (ids = []) => {
  const uniqueIds = [...new Set(ids.map((id) => String(id)).filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, full_name')
    .in('id', uniqueIds);

  if (error) throw error;

  return new Map((users || []).map((user) => [String(user.id), user]));
};

const buildGeminiSourceReports = (reports = [], usersMap = new Map()) => {
  return reports
    .map((report) => {
      const user = usersMap.get(String(report.member_id));
      return {
        memberName: mapDisplayMemberName(user?.full_name, user?.username),
        taskDone: String(report.task_done || '').trim()
      };
    })
    .filter((item) => item.taskDone);
};

// @route   GET /api/weekly-reports
// @desc    List weekly reports
// @access  Admin
export const getWeeklyReports = async (_req, res) => {
  try {
    await WeeklyReport.ensureWeeksThroughCurrentDate();
    const weeks = await WeeklyReport.list();

    res.status(200).json({
      success: true,
      data: weeks.map((week) => week.toResponse())
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch weekly reports'
    });
  }
};

// @route   GET /api/weekly-reports/:reportWeek
// @desc    Get one weekly report by week number
// @access  Admin
export const getWeeklyReportByWeek = async (req, res) => {
  try {
    const reportWeek = Number(req.params.reportWeek);

    if (!Number.isInteger(reportWeek) || reportWeek <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report week'
      });
    }

    const week = await WeeklyReport.ensureWeek(reportWeek, req.user?.id);

    res.status(200).json({
      success: true,
      data: week.toResponse()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch weekly report'
    });
  }
};

// @route   POST /api/weekly-reports/generate
// @desc    Generate weekly (or single-day) report draft rows
// @access  Admin
export const generateWeeklyReportDraft = async (req, res) => {
  try {
    const { reportWeek, startDate, endDate, singleDate } = req.body;
    const parsedWeek = Number(reportWeek);

    if (!Number.isInteger(parsedWeek) || parsedWeek <= 0) {
      return res.status(400).json({
        success: false,
        message: 'reportWeek is required and must be a positive integer'
      });
    }

    const week = await WeeklyReport.ensureWeek(parsedWeek, req.user?.id);

    let selectedDates = [];
    let resolvedStartDate = week.week_start_date;
    let resolvedEndDate = week.week_end_date;

    if (singleDate) {
      if (!isISODate(singleDate)) {
        return res.status(400).json({
          success: false,
          message: 'singleDate must use YYYY-MM-DD format'
        });
      }
      selectedDates = [singleDate];
      resolvedStartDate = singleDate;
      resolvedEndDate = singleDate;
    } else {
      const requestedStartDate = startDate || week.week_start_date;
      const requestedEndDate = endDate || week.week_end_date;

      if (!isISODate(requestedStartDate) || !isISODate(requestedEndDate)) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate must use YYYY-MM-DD format'
        });
      }

      selectedDates = buildDateRange(requestedStartDate, requestedEndDate);
      if (selectedDates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date range'
        });
      }

      if (selectedDates.length > 6) {
        return res.status(400).json({
          success: false,
          message: 'Reporting range cannot exceed 6 days'
        });
      }

      resolvedStartDate = requestedStartDate;
      resolvedEndDate = requestedEndDate;
    }

    const { data: reports, error: reportsError } = await supabase
      .from('progress_reports')
      .select('date, member_id, task_done, team_plan, created_at')
      .gte('date', resolvedStartDate)
      .lte('date', resolvedEndDate)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    if (reportsError) {
      throw reportsError;
    }

    const allReports = reports || [];
    if (allReports.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          canGenerate: false,
          message: 'No entries found for the selected reporting range.',
          reportWeek: parsedWeek,
          startDate: resolvedStartDate,
          endDate: resolvedEndDate,
          skippedDates: selectedDates,
          generatedRows: []
        }
      });
    }

    const usersMap = await fetchUsersMapByIds(allReports.map((report) => report.member_id));
    const reportsByDate = allReports.reduce((accumulator, report) => {
      const key = String(report.date);
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(report);
      return accumulator;
    }, {});

    const generatedRows = [];
    const skippedDates = [];

    selectedDates.forEach((dateISO, index) => {
      const dayReports = reportsByDate[dateISO] || [];

      if (dayReports.length === 0) {
        skippedDates.push(dateISO);
        return;
      }

      const rowNumber = singleDate ? 1 : index + 1;
      generatedRows.push({
        rowNumber,
        rowDate: dateISO,
        rowDateDisplay: formatMMDDYYYY(parseISODate(dateISO)),
        rowActivity: '',
        sourceReports: buildGeminiSourceReports(dayReports, usersMap),
        hasSourceEntries: true,
        entryCount: dayReports.length
      });
    });

    if (generatedRows.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          canGenerate: false,
          message: 'No entries found for any selected day. Generation stopped.',
          reportWeek: parsedWeek,
          startDate: resolvedStartDate,
          endDate: resolvedEndDate,
          skippedDates,
          generatedRows: []
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        canGenerate: true,
        message:
          skippedDates.length > 0
            ? `Generated ${generatedRows.length} day(s). Skipped ${skippedDates.length} empty day(s).`
            : `Generated ${generatedRows.length} day(s) successfully.`,
        reportWeek: parsedWeek,
        reportingDate: formatReportingDateRange(parseISODate(resolvedStartDate), parseISODate(resolvedEndDate)),
        signatoryDate: week.signatory_date,
        startDate: resolvedStartDate,
        endDate: resolvedEndDate,
        skippedDates,
        generatedRows
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate weekly report draft'
    });
  }
};

// @route   POST /api/weekly-reports/:reportWeek/save
// @desc    Save edited weekly draft rows
// @access  Admin
export const saveWeeklyReportDraft = async (req, res) => {
  try {
    const reportWeek = Number(req.params.reportWeek);
    const { entries = [], startDate, endDate, signatoryDate } = req.body;

    if (!Number.isInteger(reportWeek) || reportWeek <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report week'
      });
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one entry is required to save'
      });
    }

    const week = await WeeklyReport.ensureWeek(reportWeek, req.user?.id);
    const resolvedStartDate = startDate || week.week_start_date;
    const resolvedEndDate = endDate || week.week_end_date;

    if (!isISODate(resolvedStartDate) || !isISODate(resolvedEndDate)) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate must use YYYY-MM-DD format'
      });
    }

    const selectedDates = buildDateRange(resolvedStartDate, resolvedEndDate);
    if (selectedDates.length === 0 || selectedDates.length > 6) {
      return res.status(400).json({
        success: false,
        message: 'Reporting range must contain between 1 and 6 days'
      });
    }

    const byRowNumber = new Map(
      entries
        .map((entry) => ({
          rowNumber: Number(entry.rowNumber),
          rowDate: entry.rowDate,
          rowActivity: entry.rowActivity,
          hasSourceEntries: Boolean(entry.hasSourceEntries)
        }))
        .filter((entry) => Number.isInteger(entry.rowNumber) && entry.rowNumber >= 1 && entry.rowNumber <= 6)
        .map((entry) => [entry.rowNumber, entry])
    );

    const normalizedEntries = Array.from({ length: 6 }, (_, index) => {
      const rowNumber = index + 1;
      const incoming = byRowNumber.get(rowNumber);

      return {
        rowNumber,
        rowDate: incoming?.rowDate || null,
        rowActivity: incoming?.rowActivity || '',
        hasSourceEntries: Boolean(incoming?.hasSourceEntries && incoming?.rowActivity)
      };
    });

    const effectiveSignatoryDate = signatoryDate || resolvedEndDate;
    await WeeklyReport.updateWeekMetadata(reportWeek, {
      weekStartDate: resolvedStartDate,
      weekEndDate: resolvedEndDate,
      reportingDate: formatReportingDateRange(parseISODate(resolvedStartDate), parseISODate(resolvedEndDate)),
      signatoryDate: effectiveSignatoryDate,
      status: 'SAVED'
    });

    const savedWeek = await WeeklyReport.saveEntries(reportWeek, normalizedEntries, 'SAVED');

    res.status(200).json({
      success: true,
      message: 'Weekly report draft saved successfully',
      data: savedWeek.toResponse()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save weekly report draft'
    });
  }
};

// @route   POST /api/weekly-reports/:reportWeek/export-pdf
// @desc    Export saved weekly report to PDF
// @access  Admin
export const exportWeeklyReportPdfFile = async (req, res) => {
  try {
    const reportWeek = Number(req.params.reportWeek);

    if (!Number.isInteger(reportWeek) || reportWeek <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report week'
      });
    }

    const week = await WeeklyReport.ensureWeek(reportWeek, req.user?.id);
    const hasAnyActivity = (week.entries || []).some((entry) => String(entry.row_activity || '').trim().length > 0);

    if (!hasAnyActivity) {
      return res.status(400).json({
        success: false,
        message: 'No saved row activity found. Save generated rows before exporting.'
      });
    }

    const pdfBuffer = await exportWeeklyReportPdf(week.toResponse());
    const fileName = `A Priori_W${reportWeek}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to export weekly report PDF'
    });
  }
};

// @route   POST /api/weekly-reports/:reportWeek/export-docx
// @desc    Export saved weekly report to DOCX
// @access  Admin
export const exportWeeklyReportDocxFile = async (req, res) => {
  try {
    const reportWeek = Number(req.params.reportWeek);

    if (!Number.isInteger(reportWeek) || reportWeek <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report week'
      });
    }

    const week = await WeeklyReport.ensureWeek(reportWeek, req.user?.id);
    const hasAnyActivity = (week.entries || []).some((entry) => String(entry.row_activity || '').trim().length > 0);

    if (!hasAnyActivity) {
      return res.status(400).json({
        success: false,
        message: 'No saved row activity found. Save generated rows before exporting.'
      });
    }

    const docxBuffer = await renderWeeklyReportDocxBuffer(week.toResponse());
    const fileName = `A Priori_W${reportWeek}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', docxBuffer.length);
    return res.status(200).send(docxBuffer);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to export weekly report DOCX'
    });
  }
};
