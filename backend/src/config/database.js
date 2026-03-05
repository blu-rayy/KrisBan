import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
// Service role key bypasses Row Level Security — required for server-side queries
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const connectDB = async () => {
  try {
    // Test connection by querying the users table
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact' });

    if (error) {
      throw error;
    }

    console.log(`Supabase Connected Successfully`);
    return supabase;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

