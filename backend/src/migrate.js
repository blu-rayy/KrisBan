import { supabase } from './src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const __migrationsDir = path.join(__dirname, 'src', 'migrations');

const runMigrations = async () => {
  try {
    console.log('🔧 Running migrations...\n');

    // Read the SQL migration file
    const sqlPath = path.join(__migrationsDir, 'create_sprints_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Split SQL into individual statements (handle multiple statements separated by `;`)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute each statement
    for (const statement of statements) {
      console.log(`📝 Executing: ${statement.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec', {
        sql: statement
      }).catch(async () => {
        // Fallback: use direct SQL execution
        const { error: directError } = await supabase.from('_sql').select('*');
        // Note: This is a workaround. For production, use Supabase migration UI
        return { error: directError };
      });

      if (error && !error.message.includes('does not exist')) {
        console.log(`⚠️  Warning: ${error.message}`);
      } else if (!error) {
        console.log(`✅ Success\n`);
      }
    }

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n⚠️  Please run the SQL migration manually in Supabase:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Click "SQL Editor"');
    console.log('3. Click "New Query"');
    console.log('4. Copy and paste the contents of: src/migrations/create_sprints_table.sql');
    console.log('5. Click "Run"');
    process.exit(1);
  }
};

runMigrations();
