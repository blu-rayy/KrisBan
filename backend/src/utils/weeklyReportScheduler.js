import WeeklyReport from '../models/WeeklyReport.js';
import { getManilaISODate, isSundayInManila } from './weeklyReportDates.js';

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

let schedulerInterval = null;
let lastProcessedSunday = null;

const runSundayGeneration = async () => {
  try {
    if (!isSundayInManila()) {
      return;
    }

    const todayInManila = getManilaISODate();
    if (lastProcessedSunday === todayInManila) {
      return;
    }

    const createdWeek = await WeeklyReport.ensureNextWeekFromSunday();
    lastProcessedSunday = todayInManila;

    if (createdWeek) {
      console.log(
        `📅 Weekly scheduler ensured Week ${createdWeek.report_week} (${createdWeek.reporting_date})`
      );
    }
  } catch (error) {
    console.error(`❌ Weekly scheduler error: ${error.message}`);
  }
};

export const startWeeklyReportScheduler = () => {
  if (schedulerInterval) {
    return;
  }

  runSundayGeneration();
  schedulerInterval = setInterval(runSundayGeneration, CHECK_INTERVAL_MS);
  console.log('⏱️ Weekly report scheduler started (Asia/Manila Sunday checks)');
};
