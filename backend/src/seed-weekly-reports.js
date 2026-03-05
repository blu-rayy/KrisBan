import dotenv from 'dotenv';
import connectDB from './config/database.js';
import WeeklyReport from './models/WeeklyReport.js';

dotenv.config();

// ⛔ Safety guard — never run seed scripts against production
const supabaseUrl = process.env.SUPABASE_URL || '';
if (supabaseUrl.includes('supabase.co')) {
  console.error('\n⛔  BLOCKED: Seed scripts cannot run against the production Supabase database.');
  console.error('    Set SUPABASE_URL to a local instance (e.g. http://localhost:54321) and retry.\n');
  process.exit(1);
}

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
