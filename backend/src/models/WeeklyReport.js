import { supabase } from '../config/database.js';
import {
  addDays,
  formatISODate,
  getCurrentWeekNumber,
  getNextWeekNumberFromSunday,
  getWeekMetadata
} from '../utils/weeklyReportDates.js';

const WEEKLY_REPORTS_TABLE = 'weekly_reports';
const WEEKLY_REPORT_ENTRIES_TABLE = 'weekly_report_entries';

class WeeklyReport {
  constructor(data = {}) {
    this.id = data.id ? String(data.id) : null;
    this.report_week = data.report_week;
    this.week_start_date = data.week_start_date;
    this.week_end_date = data.week_end_date;
    this.reporting_date = data.reporting_date;
    this.signatory_date = data.signatory_date;
    this.status = data.status;
    this.created_by = data.created_by ? String(data.created_by) : null;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.entries = Array.isArray(data.weekly_report_entries)
      ? [...data.weekly_report_entries].sort((a, b) => a.row_number - b.row_number)
      : [];
  }

  static async findByWeek(reportWeek, teamId = null) {
    let query = supabase
      .from(WEEKLY_REPORTS_TABLE)
      .select('*, weekly_report_entries(*)')
      .eq('report_week', Number(reportWeek));

    if (teamId) query = query.eq('team_id', teamId);

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch weekly report: ${error.message}`);
    }

    return data ? new WeeklyReport(data) : null;
  }

  static async list(teamId = null) {
    let query = supabase
      .from(WEEKLY_REPORTS_TABLE)
      .select('*')
      .order('report_week', { ascending: true });

    if (teamId) query = query.eq('team_id', teamId);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list weekly reports: ${error.message}`);
    }

    return data.map((item) => new WeeklyReport(item));
  }

  static async createWeek(reportWeek, createdBy = null, teamId = null) {
    const weekMeta = getWeekMetadata(reportWeek);

    const { data: createdWeek, error: createWeekError } = await supabase
      .from(WEEKLY_REPORTS_TABLE)
      .insert([
        {
          report_week: weekMeta.reportWeek,
          week_start_date: weekMeta.weekStartDateISO,
          week_end_date: weekMeta.weekEndDateISO,
          reporting_date: weekMeta.reportingDate,
          signatory_date: weekMeta.signatoryDateISO,
          status: 'PENDING',
          created_by: createdBy,
          team_id: teamId || null
        }
      ])
      .select('*')
      .single();

    if (createWeekError) {
      throw new Error(`Failed to create weekly report: ${createWeekError.message}`);
    }

    const entryRows = Array.from({ length: 6 }, (_, index) => {
      const rowDate = addDays(weekMeta.weekStartDate, index);
      return {
        weekly_report_id: createdWeek.id,
        row_number: index + 1,
        row_date: formatISODate(rowDate),
        row_activity: '',
        has_source_entries: false
      };
    });

    const { error: createEntriesError } = await supabase
      .from(WEEKLY_REPORT_ENTRIES_TABLE)
      .insert(entryRows);

    if (createEntriesError) {
      throw new Error(`Failed to create weekly report entries: ${createEntriesError.message}`);
    }

    return WeeklyReport.findByWeek(weekMeta.reportWeek, teamId);
  }

  static async ensureWeek(reportWeek, createdBy = null, teamId = null) {
    const existingWeek = await WeeklyReport.findByWeek(reportWeek, teamId);
    if (existingWeek) {
      return existingWeek;
    }

    return WeeklyReport.createWeek(reportWeek, createdBy, teamId);
  }

  static async ensureWeeksThroughCurrentDate(createdBy = null, date = new Date(), teamId = null) {
    const currentWeek = getCurrentWeekNumber(date);
    if (currentWeek <= 0) {
      return [];
    }

    const weeks = [];
    for (let weekNumber = 1; weekNumber <= currentWeek; weekNumber += 1) {
      const week = await WeeklyReport.ensureWeek(weekNumber, createdBy, teamId);
      weeks.push(week);
    }

    return weeks;
  }

  static async ensureNextWeekFromSunday(createdBy = null, date = new Date(), teamId = null) {
    const nextWeekNumber = getNextWeekNumberFromSunday(date);

    if (nextWeekNumber <= 0) {
      return null;
    }

    return WeeklyReport.ensureWeek(nextWeekNumber, createdBy, teamId);
  }

  static async updateWeekMetadata(reportWeek, metadata = {}, teamId = null) {
    const updatePayload = {};

    if (metadata.weekStartDate) updatePayload.week_start_date = metadata.weekStartDate;
    if (metadata.weekEndDate) updatePayload.week_end_date = metadata.weekEndDate;
    if (metadata.reportingDate) updatePayload.reporting_date = metadata.reportingDate;
    if (metadata.signatoryDate) updatePayload.signatory_date = metadata.signatoryDate;
    if (metadata.status) updatePayload.status = metadata.status;

    if (Object.keys(updatePayload).length === 0) {
      return WeeklyReport.findByWeek(reportWeek, teamId);
    }

    let query = supabase
      .from(WEEKLY_REPORTS_TABLE)
      .update(updatePayload)
      .eq('report_week', Number(reportWeek));

    if (teamId) query = query.eq('team_id', teamId);

    const { error } = await query;

    if (error) {
      throw new Error(`Failed to update weekly report metadata: ${error.message}`);
    }

    return WeeklyReport.findByWeek(reportWeek, teamId);
  }

  static async saveEntries(reportWeek, entries = [], status = 'GENERATED', teamId = null) {
    const week = await WeeklyReport.ensureWeek(reportWeek, null, teamId);
    const sanitizedEntries = entries
      .map((entry) => ({
        weekly_report_id: week.id,
        row_number: Number(entry.rowNumber),
        row_date: entry.rowDate || null,
        row_activity: entry.rowActivity || '',
        has_source_entries: Boolean(entry.hasSourceEntries)
      }))
      .filter((entry) => Number.isInteger(entry.row_number) && entry.row_number >= 1 && entry.row_number <= 6);

    if (sanitizedEntries.length > 0) {
      const { error: entriesError } = await supabase
        .from(WEEKLY_REPORT_ENTRIES_TABLE)
        .upsert(sanitizedEntries, { onConflict: 'weekly_report_id,row_number' });

      if (entriesError) {
        throw new Error(`Failed to save weekly report entries: ${entriesError.message}`);
      }
    }

    await WeeklyReport.updateWeekMetadata(reportWeek, { status }, teamId);
    return WeeklyReport.findByWeek(reportWeek, teamId);
  }

  toResponse() {
    return {
      id: this.id,
      reportWeek: this.report_week,
      weekStartDate: this.week_start_date,
      weekEndDate: this.week_end_date,
      reportingDate: this.reporting_date,
      signatoryDate: this.signatory_date,
      status: this.status,
      createdBy: this.created_by,
      createdAt: this.created_at,
      updatedAt: this.updated_at,
      entries: this.entries.map((entry) => ({
        id: entry.id,
        rowNumber: entry.row_number,
        rowDate: entry.row_date,
        rowActivity: entry.row_activity,
        hasSourceEntries: entry.has_source_entries,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at
      }))
    };
  }
}

export default WeeklyReport;
