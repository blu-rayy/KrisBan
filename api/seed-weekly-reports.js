import dotenv from 'dotenv';
import connectDB from './config/database.js';
import WeeklyReport from './models/WeeklyReport.js';

dotenv.config();

const seedWeeklyReports = async () => {
  try {
    await connectDB();

    const weeks = await WeeklyReport.ensureWeeksThroughCurrentDate();

    console.log(`✅ Weekly reports ensured from Week 1 through Week ${weeks.length}`);
    console.log('ℹ️ Fixed week baseline: January 12-17, 2026');

    process.exit(0);
  } catch (error) {
    console.error(`❌ Failed to seed weekly reports: ${error.message}`);
    process.exit(1);
  }
};

seedWeeklyReports();
