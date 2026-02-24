import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

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

