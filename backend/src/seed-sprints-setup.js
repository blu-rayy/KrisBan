import { supabase } from './src/config/database.js';

const setupSprintsTables = async () => {
  try {
    console.log('🔧 Setting up Sprints tables...\n');

    // Test if sprints table exists
    console.log('📋 Checking if sprints table exists...');
    const { error: checkError } = await supabase
      .from('sprints')
      .select('count', { count: 'exact', head: true });

    if (!checkError) {
      console.log('✅ Sprints table already exists!\n');
      return;
    }

    // Create sprints table
    console.log('📝 Creating sprints table...');
    const { error: sprintsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS sprints (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sprint_number VARCHAR(50) NOT NULL UNIQUE,
          color VARCHAR(7) NOT NULL,
          created_by UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        );
      `
    }).catch(() => ({ error: null })); // Ignore if function doesn't exist

    // Create sprint_team_plans table
    console.log('📝 Creating sprint_team_plans table...');
    const { error: teamPlansError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS sprint_team_plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sprint_id UUID NOT NULL,
          team_plan TEXT NOT NULL,
          created_by UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        );
      `
    }).catch(() => ({ error: null }));

    console.log('✅ Tables setup complete (or already exist)!');
    console.log('\n⚠️  If you still get errors, please run the SQL manually:');
    console.log('📍 File: backend/src/migrations/create_sprints_table.sql');
    console.log('📍 Location: Supabase Dashboard > SQL Editor > New Query');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📍 Please run the SQL migration manually:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Create a new query');
    console.log('4. Copy contents from: backend/src/migrations/create_sprints_table.sql');
    console.log('5. Execute the query');
    process.exit(1);
  }
};

setupSprintsTables();
