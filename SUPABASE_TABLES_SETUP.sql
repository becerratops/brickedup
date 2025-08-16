-- BrickTrack Supabase Tables Setup
-- Copy and paste this entire file into your Supabase SQL Editor
-- Then click "Run" to create all the necessary tables

-- Step 1: Create all tables
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

CREATE TABLE IF NOT EXISTS bt_teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bt_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bt_auth_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  team_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Insert default data
INSERT INTO bt_teams (id, name, color) VALUES
  ('development', 'Development', '#3b82f6'),
  ('design', 'Design', '#8b5cf6'),
  ('marketing', 'Marketing', '#10b981'),
  ('product', 'Product', '#f59e0b')
ON CONFLICT (id) DO NOTHING;

INSERT INTO bt_users (id, name, team_id) VALUES
  ('admin', 'Admin', 'development'),
  ('adam', 'Adam', 'development'),
  ('sarah', 'Sarah', 'design'),
  ('mike', 'Mike', 'marketing')
ON CONFLICT (id) DO NOTHING;

-- Step 3: Disable Row Level Security (RLS) for testing
-- Note: In production, you'd want proper RLS policies
ALTER TABLE bt_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE bt_sprints DISABLE ROW LEVEL SECURITY;
ALTER TABLE bt_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE bt_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE bt_auth_users DISABLE ROW LEVEL SECURITY;

-- Step 4: Verify tables were created
SELECT 
  table_name,
  '✅ Created' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'bt_%'
ORDER BY table_name;
