# Supabase Setup Guide for BrickTrack

## The Problem

Your app is currently running in **local-only mode** because Supabase is not configured. This means:
- ✅ You and your friend can create accounts locally
- ❌ You can't see each other's data
- ❌ Data doesn't sync between devices
- ❌ No real-time collaboration

## What's Happening

1. **Missing Environment Variables**: The app can't find `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. **Local Storage Only**: All data is stored in each user's browser localStorage
3. **No Remote Sync**: The `remoteEnabled()` function returns `false`
4. **Isolated Users**: Each user has their own isolated data

## Solution: Set Up Supabase

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `bricktrack` (or whatever you prefer)
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait for setup to complete (2-3 minutes)

### Step 2: Get Your Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 3: Create Environment File

1. In your project root, create a `.env` file:
   ```bash
   touch .env
   ```

2. Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Important**: Add `.env` to your `.gitignore` (it should already be there)

### Step 4: Create Database Tables

Your Supabase project needs these tables. Go to **SQL Editor** and run:

```sql
-- Create the tables
CREATE TABLE bt_entries (
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

CREATE TABLE bt_sprints (
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

CREATE TABLE bt_teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bt_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bt_auth_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  team_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default teams
INSERT INTO bt_teams (id, name, color) VALUES
  ('development', 'Development', '#3b82f6'),
  ('design', 'Design', '#8b5cf6'),
  ('marketing', 'Marketing', '#10b981'),
  ('product', 'Product', '#f59e0b');

-- Insert default users
INSERT INTO bt_users (id, name, team_id) VALUES
  ('admin', 'Admin', 'development'),
  ('adam', 'Adam', 'development'),
  ('sarah', 'Sarah', 'design'),
  ('mike', 'Mike', 'marketing');
```

### Step 5: Set Row Level Security (RLS)

For now, disable RLS to allow all operations:

```sql
-- Disable RLS on all tables (for testing)
ALTER TABLE bt_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE bt_sprints DISABLE ROW LEVEL SECURITY;
ALTER TABLE bt_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE bt_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE bt_auth_users DISABLE ROW LEVEL SECURITY;
```

**Note**: In production, you'd want proper RLS policies, but this gets you started.

### Step 6: Test the Setup

1. **Restart your dev server**:
   ```bash
   npm run dev
   ```

2. **Check the browser console** - you should see:
   ```
   🔧 Supabase configuration check: { hasUrl: true, hasKey: true, configured: true }
   ✅ Supabase client created successfully
   🔗 Remote sync enabled: true
   🔄 Starting syncAllToLocal...
   📥 Fetching data from Supabase...
   ```

3. **Check the debug panel** (bottom-right corner) - should show:
   - Supabase Configured: Yes
   - Remote Sync: Enabled

### Step 7: Test Data Sync

1. **Create a test entry** in your app
2. **Check Supabase dashboard** → **Table Editor** → **bt_entries** - you should see your data
3. **Have your friend create an account** and add some data
4. **Refresh your app** - you should now see their data!

## Troubleshooting

### Still Not Working?

1. **Check environment variables**:
   ```bash
   # In your terminal, check if they're loaded
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

2. **Verify Supabase connection**:
   - Go to Supabase dashboard → **Settings** → **API**
   - Make sure your keys match exactly

3. **Check browser console** for errors:
   - Network errors (CORS issues)
   - Authentication errors
   - Database permission errors

### Common Issues

- **CORS errors**: Make sure your Supabase project allows your domain
- **Permission denied**: Check if RLS is properly configured
- **Table not found**: Make sure you created all the tables
- **Environment not loading**: Restart your dev server after creating `.env`

## For Production (Netlify)

When deploying to Netlify:

1. **Add environment variables** in Netlify dashboard:
   - Go to **Site settings** → **Environment variables**
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

2. **Redeploy** your site

3. **Test** with multiple users

## What You'll Get

Once configured, you'll have:
- ✅ **Real-time data sync** between all users
- ✅ **Cross-device access** to your data
- ✅ **Team collaboration** - see everyone's standups
- ✅ **Persistent data** - no more lost data on browser clear
- ✅ **Multi-user support** - proper team management

## Next Steps

After basic setup works:
1. **Enable RLS** with proper policies
2. **Add user authentication** with Supabase Auth
3. **Set up email invitations**
4. **Add data backup/export**

Let me know if you run into any issues during setup! 🚀
