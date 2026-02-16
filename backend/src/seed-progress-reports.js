import fs from 'fs';
import csv from 'csv-parser';
import { supabase } from './config/database.js';
import User from './models/User.js';
import ProgressReport from './models/ProgressReport.js';

// Map of member names to their student numbers
const memberMap = {
  'Kristian': '202311645',
  'Angel': '202311538',
  'Michael': '202312132',
  'Marianne': '202311273'
};

const seedProgressReports = async () => {
  try {
    console.log('🚀 Starting Progress Reports CSV import...\n');

    // First, create users if they don't exist
    console.log('📝 Creating/verifying team members...');
    const userIds = {};

    for (const [name, studentNumber] of Object.entries(memberMap)) {
      let user = await User.findOne({ studentNumber });
      
      if (!user) {
        console.log(`  Creating user: ${name} (${studentNumber})`);
        user = await User.create({
          studentNumber,
          password: 'TempPassword123!',
          fullName: name,
          username: name.toLowerCase(),
          role: 'USER',
          isFirstLogin: false,
          isActive: true
        });
      } else {
        console.log(`  Found user: ${name} (${studentNumber})`);
      }
      
      userIds[name] = user.id;
    }

    console.log('\n📊 Parsing CSV file...');
    const records = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream('./sprint_logs.csv')
        .pipe(csv())
        .on('data', (row) => {
          records.push(row);
        })
        .on('end', async () => {
          console.log(`  Found ${records.length} records in CSV\n`);

          console.log('💾 Inserting progress reports...');
          let successCount = 0;
          let errorCount = 0;

          for (const record of records) {
            try {
              const date = new Date(record.Date);
              const memberId = userIds[record.Member.trim()];

              if (!memberId) {
                console.log(`  ⚠️  Skipping entry for unknown member: ${record.Member}`);
                errorCount++;
                continue;
              }

              // Use the member user as creator (entries created by the person they're for)
              const creatorUser = await User.findById(memberId);

              const progressReport = await ProgressReport.create({
                date: date.toISOString().split('T')[0],
                member_id: memberId,
                sprint_no: record['Sprint #'].trim(),
                team_plan: record['Team Plan'].trim() || '',
                category: record.Category.trim(),
                task_done: record['What I Did Today'].trim(),
                created_by: creatorUser.id
              });

              successCount++;
              process.stdout.write(`\r  Inserted: ${successCount}/${records.length}`);
            } catch (err) {
              errorCount++;
              console.log(`\n  ❌ Error inserting record: ${err.message}`);
            }
          }

          console.log(`\n\n✅ Import Complete!`);
          console.log(`  ✓ Successfully inserted: ${successCount} records`);
          if (errorCount > 0) {
            console.log(`  ⚠️  Errors: ${errorCount} records`);
          }

          // Verify by fetching some records
          const allReports = await ProgressReport.getAll('created_at', false);
          console.log(`\n📈 Total progress reports in database: ${allReports.length}`);

          // Summary by member
          const byMember = {};
          allReports.forEach(report => {
            if (!byMember[report.member_id]) {
              byMember[report.member_id] = 0;
            }
            byMember[report.member_id]++;
          });

          console.log('\n📋 Reports by member:');
          for (const [name, userId] of Object.entries(userIds)) {
            const count = byMember[userId] || 0;
            console.log(`  ${name}: ${count} entries`);
          }

          resolve();
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  }
};

// Run the seed
seedProgressReports()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
