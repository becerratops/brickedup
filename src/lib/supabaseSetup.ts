import { supabase, isSupabaseConfigured } from './supabaseClient';

// SQL to create tables if they don't exist
const CREATE_TABLES_SQL = `
-- Create bt_entries table
CREATE TABLE IF NOT EXISTS bt_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  date TEXT NOT NULL,
  yesterday_tasks JSONB,
  today_tasks JSONB,
  blockers TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bt_sprints table
CREATE TABLE IF NOT EXISTS bt_sprints (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  goals JSONB,
  backlog_items JSONB,
  task_breakdown JSONB,
  capacity_planning TEXT,
  risks TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bt_teams table
CREATE TABLE IF NOT EXISTS bt_teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bt_users table
CREATE TABLE IF NOT EXISTS bt_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bt_auth_users table
CREATE TABLE IF NOT EXISTS bt_auth_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  team_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

// SQL to insert default data
const INSERT_DEFAULTS_SQL = `
-- Insert default teams if they don't exist
INSERT INTO bt_teams (id, name, color) VALUES
  ('development', 'Development', '#3b82f6'),
  ('design', 'Design', '#8b5cf6'),
  ('marketing', 'Marketing', '#10b981'),
  ('product', 'Product', '#f59e0b')
ON CONFLICT (id) DO NOTHING;

-- Insert default users if they don't exist
INSERT INTO bt_users (id, name, team_id) VALUES
  ('admin', 'Admin', 'development'),
  ('adam', 'Adam', 'development'),
  ('sarah', 'Sarah', 'design'),
  ('mike', 'Mike', 'marketing')
ON CONFLICT (id) DO NOTHING;
`;

// SQL to disable RLS for testing
const DISABLE_RLS_SQL = `
-- Disable RLS on all tables (for testing)
ALTER TABLE bt_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE bt_sprints DISABLE ROW LEVEL SECURITY;
ALTER TABLE bt_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE bt_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE bt_auth_users DISABLE ROW LEVEL SECURITY;
`;

export async function ensureTablesExist(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.log('⚠️ Supabase not configured, skipping table creation');
    return false;
  }

  try {
    console.log('🔧 Checking if Supabase tables exist...');
    
    // Check if tables exist by trying to select from them
    const { error: checkError } = await supabase
      .from('bt_users')
      .select('count')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      // Table doesn't exist (PostgreSQL error code for undefined table)
      console.log('📋 Tables not found, creating them...');
      
      // Create tables
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: CREATE_TABLES_SQL
      });
      
      if (createError) {
        console.error('❌ Failed to create tables:', createError);
        return false;
      }
      
      console.log('✅ Tables created successfully');
      
      // Insert default data
      const { error: insertError } = await supabase.rpc('exec_sql', {
        sql: INSERT_DEFAULTS_SQL
      });
      
      if (insertError) {
        console.error('❌ Failed to insert default data:', insertError);
        return false;
      }
      
      console.log('✅ Default data inserted successfully');
      
      // Disable RLS
      const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql: DISABLE_RLS_SQL
      });
      
      if (rlsError) {
        console.error('❌ Failed to disable RLS:', rlsError);
        // Don't return false here as tables are created
      } else {
        console.log('✅ RLS disabled successfully');
      }
      
      return true;
    } else if (checkError) {
      console.error('❌ Error checking tables:', checkError);
      return false;
    } else {
      console.log('✅ Tables already exist');
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to ensure tables exist:', error);
    return false;
  }
}

// Alternative approach using individual table creation if RPC doesn't work
export async function createTablesIndividually(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    console.log('🔧 Creating tables individually...');
    
    // Since we can't create tables via the client API, we'll just check if they exist
    // and provide instructions for manual creation
    
    console.log('⚠️ Cannot create tables via client API. Tables need to be created manually.');
    console.log('📋 Please run the following SQL in your Supabase SQL Editor:');
    console.log('');
    console.log(CREATE_TABLES_SQL);
    console.log('');
    console.log('Then run:');
    console.log(INSERT_DEFAULTS_SQL);
    console.log('');
    console.log('And finally:');
    console.log(DISABLE_RLS_SQL);
    
    // Check if any tables exist after potential manual creation
    const { error: checkError } = await supabase
      .from('bt_users')
      .select('count')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      console.log('❌ Tables still do not exist. Please create them manually in Supabase dashboard.');
      return false;
    } else {
      console.log('✅ Tables now exist (likely created manually)');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Failed to check tables individually:', error);
    return false;
  }
}

// Function to check if tables exist without trying to create them
export async function checkTablesExist(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    console.log('🔍 Checking if tables exist...');
    
    // Try to query each table
    const tables = ['bt_entries', 'bt_sprints', 'bt_teams', 'bt_users', 'bt_auth_users'];
    const results = await Promise.all(
      tables.map(async (table) => {
        const { error } = await supabase.from(table).select('count').limit(1);
        return { table, exists: !error || error.code !== '42P01' };
      })
    );
    
    const existingTables = results.filter(r => r.exists).map(r => r.table);
    const missingTables = results.filter(r => !r.exists).map(r => r.table);
    
    console.log(`✅ Existing tables: ${existingTables.join(', ')}`);
    if (missingTables.length > 0) {
      console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
    }
    
    return missingTables.length === 0;
  } catch (error) {
    console.error('❌ Failed to check tables:', error);
    return false;
  }
}
