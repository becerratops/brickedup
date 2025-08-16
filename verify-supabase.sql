-- Verify Supabase Tables Setup
-- Run this in your Supabase SQL Editor to check if tables exist

-- Check if tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('bt_entries', 'bt_sprints', 'bt_teams', 'bt_users', 'bt_auth_users') 
    THEN '✅ Required table'
    ELSE '❌ Unexpected table'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'bt_%'
ORDER BY table_name;

-- Check table structure for bt_users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'bt_users'
ORDER BY ordinal_position;

-- Check if RLS is disabled (should be disabled for testing)
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename LIKE 'bt_%';

-- Check if there's any data in the tables
SELECT 'bt_entries' as table_name, COUNT(*) as row_count FROM bt_entries
UNION ALL
SELECT 'bt_sprints' as table_name, COUNT(*) as row_count FROM bt_sprints  
UNION ALL
SELECT 'bt_teams' as table_name, COUNT(*) as row_count FROM bt_teams
UNION ALL
SELECT 'bt_users' as table_name, COUNT(*) as row_count FROM bt_users
UNION ALL
SELECT 'bt_auth_users' as table_name, COUNT(*) as row_count FROM bt_auth_users;

-- Test inserting a sample user
INSERT INTO bt_users (id, name, team_id) 
VALUES ('test-' || EXTRACT(EPOCH FROM NOW())::TEXT, 'Test User', 'development')
ON CONFLICT (id) DO NOTHING
RETURNING *;

-- Clean up test user
DELETE FROM bt_users WHERE name = 'Test User';
