import { supabase } from './config/database.js';

async function seedTeamPlans() {
  try {
    console.log('\n🌱 Seeding team plans from progress reports...\n');

    // Get a valid user ID to use as created_by
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('❌ Error fetching user:', userError);
      process.exit(1);
    }

    const createdByUserId = users[0].id;
    console.log(`👤 Using user ID: ${createdByUserId}\n`);

    // Fetch all progress reports with their sprint information
    const { data: progressReports, error: fetchError } = await supabase
      .from('progress_reports')
      .select('sprint_id, sprint_no, team_plan');

    if (fetchError) {
      console.error('❌ Error fetching progress reports:', fetchError);
      process.exit(1);
    }

    if (!progressReports || progressReports.length === 0) {
      console.log('⚠️  No progress reports found');
      process.exit(0);
    }

    // Group team plans by sprint_id
    const teamPlansBySprintId = {};
    progressReports.forEach(report => {
      if (report.sprint_id && report.team_plan && report.team_plan.trim()) {
        if (!teamPlansBySprintId[report.sprint_id]) {
          teamPlansBySprintId[report.sprint_id] = new Set();
        }
        teamPlansBySprintId[report.sprint_id].add(report.team_plan);
      }
    });

    console.log(`📊 Found team plans for ${Object.keys(teamPlansBySprintId).length} sprints\n`);

    // Check existing team plans
    const { data: existingTeamPlans, error: existingError } = await supabase
      .from('sprint_team_plans')
      .select('id, sprint_id, team_plan');

    if (existingError) {
      console.error('❌ Error fetching existing team plans:', existingError);
      process.exit(1);
    }

    // Create a set of existing team plans (sprint_id:team_plan)
    const existingPlansSet = new Set(
      (existingTeamPlans || []).map(tp => `${tp.sprint_id}:${tp.team_plan}`)
    );

    let addedCount = 0;

    // Add new team plans
    for (const [sprintId, teamPlans] of Object.entries(teamPlansBySprintId)) {
      for (const teamPlan of teamPlans) {
        const planKey = `${sprintId}:${teamPlan}`;
        
        if (!existingPlansSet.has(planKey)) {
          const { error: insertError } = await supabase
            .from('sprint_team_plans')
            .insert([
              {
                sprint_id: sprintId,
                team_plan: teamPlan,
                created_by: createdByUserId
              }
            ]);

          if (insertError) {
            console.error(`❌ Error adding team plan "${teamPlan}" to sprint ${sprintId}:`, insertError);
          } else {
            console.log(`✅ Added team plan: "${teamPlan}" → Sprint ${sprintId}`);
            addedCount++;
          }
        }
      }
    }

    console.log(`\n🎉 Seeding complete! Added ${addedCount} new team plans.\n`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedTeamPlans();
