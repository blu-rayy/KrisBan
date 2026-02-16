import { supabase } from './config/database.js';

// Color palette for sprints (from controller)
const SPRINT_COLORS = [
  '#BFDBFE', // Light Blue
  '#DDD6FE', // Light Purple
  '#FBCFE8', // Light Pink
  '#FCD34D', // Light Amber
  '#A7F3D0', // Light Emerald
  '#A5F3FC', // Light Cyan
  '#FECACA', // Light Red
  '#FED7AA', // Light Orange
  '#C7D2FE', // Light Indigo
  '#99F6E4'  // Light Teal
];

const getRandomColor = (usedColors = []) => {
  const availableColors = SPRINT_COLORS.filter(color => !usedColors.includes(color));
  if (availableColors.length === 0) {
    return SPRINT_COLORS[Math.floor(Math.random() * SPRINT_COLORS.length)];
  }
  return availableColors[Math.floor(Math.random() * availableColors.length)];
};

const seedSprints = async () => {
  try {
    console.log('🌱 Seeding sprints from progress reports...\n');

    // Get admin user (usually the first admin or PM)
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'ADMIN')
      .limit(1)
      .single();

    if (adminError || !adminUser) {
      throw new Error('Admin user not found. Please ensure admin user exists first.');
    }

    console.log('👤 Using admin user:', adminUser.id);

    // Get all unique sprint numbers from progress_reports
    const { data: progressReports, error: reportsError } = await supabase
      .from('progress_reports')
      .select('sprint_no')
      .order('sprint_no');

    if (reportsError) throw reportsError;

    // Get unique sprint numbers
    const uniqueSprintNumbers = [...new Set(progressReports.map(r => r.sprint_no))];
    console.log(`\n📋 Found ${uniqueSprintNumbers.length} unique sprints:\n`);
    uniqueSprintNumbers.forEach((sprint, idx) => {
      console.log(`   ${idx + 1}. ${sprint}`);
    });

    // Check existing sprints
    const { data: existingSprints, error: existingError } = await supabase
      .from('sprints')
      .select('sprint_number');

    if (existingError) throw existingError;

    const existingSprintNumbers = new Set(existingSprints.map(s => s.sprint_number));
    const sprintsToCreate = uniqueSprintNumbers.filter(s => !existingSprintNumbers.has(s));

    if (sprintsToCreate.length === 0) {
      console.log('\n✅ All sprints already exist in the sprints table!\n');
      process.exit(0);
    }

    console.log(`\n🆕 Creating ${sprintsToCreate.length} new sprints...\n`);

    const usedColors = [];
    const createdSprints = [];

    // Create sprints
    for (const sprintNumber of sprintsToCreate) {
      const color = getRandomColor(usedColors);
      usedColors.push(color);

      const { data: sprint, error: createError } = await supabase
        .from('sprints')
        .insert([
          {
            sprint_number: sprintNumber,
            color: color,
            created_by: adminUser.id
          }
        ])
        .select('*')
        .single();

      if (createError) {
        console.error(`❌ Error creating sprint ${sprintNumber}:`, createError.message);
        continue;
      }

      createdSprints.push(sprint);
      console.log(`✅ Created: ${sprintNumber} (${color})`);
    }

    // Now update progress_reports with sprint_id
    console.log(`\n🔗 Linking progress reports to sprints...\n`);

    const { data: allSprints } = await supabase
      .from('sprints')
      .select('id, sprint_number');

    // Create a map of sprint_number -> sprint_id
    const sprintMap = {};
    allSprints.forEach(sprint => {
      sprintMap[sprint.sprint_number] = sprint.id;
    });

    // Update progress reports
    let updatedCount = 0;
    for (const sprintNumber of uniqueSprintNumbers) {
      const sprintId = sprintMap[sprintNumber];
      if (sprintId) {
        const { error: updateError } = await supabase
          .from('progress_reports')
          .update({ sprint_id: sprintId })
          .eq('sprint_no', sprintNumber);

        if (updateError) {
          console.error(`❌ Error updating progress reports for ${sprintNumber}:`, updateError.message);
        } else {
          const { count } = await supabase
            .from('progress_reports')
            .select('id', { count: 'exact', head: true })
            .eq('sprint_id', sprintId);
          
          if (count) {
            updatedCount += count;
            console.log(`✅ Linked ${count} reports to ${sprintNumber}`);
          }
        }
      }
    }

    console.log(`\n✅ Total progress reports updated: ${updatedCount}`);
    console.log(`\n🎉 Sprint seeding completed successfully!\n`);
    console.log(`📊 Summary:`);
    console.log(`   • Created sprints: ${createdSprints.length}`);
    console.log(`   • Total sprints: ${allSprints.length}`);
    console.log(`   • Progress reports linked: ${updatedCount}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.log('\n⚠️  Make sure:');
    console.log('   1. The sprints table exists (run SQL migration first)');
    console.log('   2. Admin user exists in the database');
    console.log('   3. Progress reports have sprint_no values\n');
    process.exit(1);
  }
};

seedSprints();
