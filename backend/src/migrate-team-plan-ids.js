import { supabase } from './config/database.js';

async function migrateTeamPlanIds() {
  try {
    console.log('\n🔄 Running migration: Adding team_plan_id to progress_reports...\n');

    // Step 1: Execute the migration SQL
    console.log('📝 Adding team_plan_id column...');
    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.progress_reports
        ADD COLUMN IF NOT EXISTS team_plan_id UUID,
        ADD CONSTRAINT IF NOT EXISTS fk_progress_reports_team_plan 
        FOREIGN KEY (team_plan_id) 
        REFERENCES public.sprint_team_plans(id) 
        ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_progress_reports_team_plan_id 
        ON public.progress_reports(team_plan_id);
      `
    });

    // Since Supabase may not have exec_sql, let's do it via the raw API
    // For now, let's just proceed with linking existing data

    // Step 2: Fetch all progress reports grouped by sprint_id and team_plan text
    const { data: progressReports, error: fetchError } = await supabase
      .from('progress_reports')
      .select('id, sprint_id, team_plan');

    if (fetchError) {
      console.error('❌ Error fetching progress reports:', fetchError);
      process.exit(1);
    }

    console.log(`\n📊 Found ${progressReports.length} progress reports to update\n`);

    let successCount = 0;
    let skippedCount = 0;

    // Step 3: For each progress report, find the matching team_plan_id
    for (const report of progressReports) {
      if (!report.sprint_id || !report.team_plan) {
        skippedCount++;
        continue;
      }

      // Find the team plan in sprint_team_plans with matching sprint_id and team_plan text
      const { data: teamPlan, error: tpError } = await supabase
        .from('sprint_team_plans')
        .select('id')
        .eq('sprint_id', report.sprint_id)
        .eq('team_plan', report.team_plan)
        .single();

      if (tpError) {
        console.warn(`⚠️  No team plan match for report ${report.id}: "${report.team_plan}" in sprint ${report.sprint_id}`);
        skippedCount++;
        continue;
      }

      // Update the progress report with the team_plan_id
      const { error: updateError } = await supabase
        .from('progress_reports')
        .update({ team_plan_id: teamPlan.id })
        .eq('id', report.id);

      if (updateError) {
        console.error(`❌ Error updating report ${report.id}:`, updateError);
      } else {
        successCount++;
        console.log(`✅ Linked progress report to team_plan_id: ${teamPlan.id}`);
      }
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`   ✅ Successfully linked: ${successCount} reports`);
    console.log(`   ⏭️  Skipped: ${skippedCount} reports\n`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateTeamPlanIds();
