import { supabase } from '@/lib/supabaseClient';
import { remoteEnabled, T_ENTRIES, T_SPRINTS, T_TEAMS, T_USERS, T_AUTH_USERS } from '@/lib/supabaseUtils';
import type { StandupEntry, Sprint, Team, User } from '@/types/bricktrack';
import type { AuthUser } from '@/types/auth';

// One-time or periodic pull of all remote data into localStorage
export async function syncAllToLocal(): Promise<void> {
  console.log('🔄 Starting syncAllToLocal...');
  if (!remoteEnabled()) {
    console.log('❌ Remote sync disabled, skipping syncAllToLocal');
    return;
  }

  try {
    console.log('📥 Fetching data from Supabase...');
    const [entriesRes, sprintsRes, teamsRes, usersRes] = await Promise.all([
      supabase.from(T_ENTRIES).select('*'),
      supabase.from(T_SPRINTS).select('*'),
      supabase.from(T_TEAMS).select('*'),
      supabase.from(T_USERS).select('*'),
    ]);

    console.log('📊 Supabase responses:', {
      entries: entriesRes,
      sprints: sprintsRes,
      teams: teamsRes,
      users: usersRes
    });

    if (entriesRes.data) {
      // Map database fields (snake_case) back to frontend fields (camelCase)
      const mappedEntries = entriesRes.data.map((entry: any) => ({
        id: entry.id,
        userId: entry.user_id, // Map user_id back to userId
        teamId: entry.team_id, // Map team_id back to teamId
        date: entry.date,
        yesterdayTasks: entry.yesterday_tasks,
        todayTasks: entry.today_tasks,
        blockers: entry.blockers,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      }));
      localStorage.setItem('bricktrack_entries', JSON.stringify(mappedEntries));
      console.log('✅ Synced entries:', mappedEntries.length);
    }
    if (sprintsRes.data) {
      // Map database fields (snake_case) back to frontend fields (camelCase)
      const mappedSprints = sprintsRes.data.map((sprint: any) => ({
        id: sprint.id,
        teamId: sprint.team_id, // Map team_id back to teamId
        name: sprint.name,
        startDate: sprint.start_date, // Map start_date back to startDate
        endDate: sprint.end_date, // Map end_date back to endDate
        goals: sprint.goals,
        backlogItems: sprint.backlog_items, // Map backlog_items back to backlogItems
        taskBreakdown: sprint.task_breakdown, // Map task_breakdown back to taskBreakdown
        capacityPlanning: sprint.capacity_planning,
        risks: sprint.risks,
        notes: sprint.notes,
        isActive: sprint.is_active, // Map is_active back to isActive
      }));
      localStorage.setItem('bricktrack_sprints', JSON.stringify(mappedSprints));
      console.log('✅ Synced sprints:', mappedSprints.length);
    }
    if (teamsRes.data) {
      localStorage.setItem('bricktrack_teams', JSON.stringify(teamsRes.data as Team[]));
      console.log('✅ Synced teams:', teamsRes.data.length);
    }
    if (usersRes.data) {
      // Map database fields (snake_case) back to frontend fields (camelCase)
      const mappedUsers = usersRes.data.map((user: any) => ({
        id: user.id,
        name: user.name,
        teamId: user.team_id, // Map team_id back to teamId
      }));
      localStorage.setItem('bricktrack_users', JSON.stringify(mappedUsers));
      console.log('✅ Synced users:', mappedUsers.length);
    }
  } catch (error) {
    console.error('❌ Remote sync failed:', error);
  }
}

export async function pushEntry(entry: StandupEntry): Promise<void> {
  console.log('📤 Pushing entry to remote:', entry.id);
  if (!remoteEnabled()) {
    console.log('❌ Remote sync disabled, skipping pushEntry');
    return;
  }
  try {
    // Map frontend fields (camelCase) to database fields (snake_case)
    const mappedEntry = {
      id: entry.id,
      user_id: entry.userId, // Map userId to user_id
      team_id: entry.teamId, // Map teamId to team_id
      date: entry.date,
      yesterday_tasks: entry.yesterdayTasks,
      today_tasks: entry.todayTasks,
      blockers: entry.blockers,
      created_at: entry.createdAt,
      updated_at: entry.updatedAt,
    };
    
    const result = await supabase.from(T_ENTRIES).upsert(mappedEntry, { onConflict: 'id' });
    console.log('✅ Entry pushed to remote:', result);
  } catch (error) {
    console.error('❌ Failed to push entry:', error);
  }
}

export async function pushSprint(sprint: Sprint): Promise<void> {
  if (!remoteEnabled()) return;
  try {
    // Map frontend fields (camelCase) to database fields (snake_case)
    const mappedSprint = {
      id: sprint.id,
      team_id: sprint.teamId, // Map teamId to team_id
      name: sprint.name,
      start_date: sprint.startDate, // Map startDate to start_date
      end_date: sprint.endDate, // Map endDate to end_date
      goals: sprint.goals,
      backlog_items: sprint.backlogItems, // Map backlogItems to backlog_items
      task_breakdown: sprint.taskBreakdown, // Map taskBreakdown to task_breakdown
      capacity_planning: sprint.capacityPlanning,
      risks: sprint.risks,
      notes: sprint.notes,
      is_active: sprint.isActive, // Map isActive to is_active
    };
    
    await supabase.from(T_SPRINTS).upsert(mappedSprint, { onConflict: 'id' });
  } catch (error) {
    console.warn('Failed to push sprint:', error);
  }
}

export async function pushTeams(teams: Team[]): Promise<void> {
  if (!remoteEnabled()) return;
  try {
    await supabase.from(T_TEAMS).upsert(teams, { onConflict: 'id' });
  } catch (error) {
    console.warn('Failed to push teams:', error);
  }
}

export async function pushUsers(users: (User | AuthUser)[]): Promise<void> {
  if (!remoteEnabled()) return;
  // Normalize to database schema (snake_case)
  const mapped = users.map((u: Partial<User & AuthUser>) => ({
    id: String(u.id ?? ''),
    name: u.name ?? u.username ?? 'User',
    team_id: u.teamId ?? 'development', // Map teamId to team_id for database
  }));
  try {
    await supabase.from(T_USERS).upsert(mapped, { onConflict: 'id' });
  } catch (error) {
    console.warn('Failed to push users:', error);
  }
}

// --- Auth users (demo) ---
export interface AuthRemoteUser extends AuthUser {
  passwordHash: string;
}

export async function upsertAuthUser(user: AuthRemoteUser): Promise<void> {
  if (!remoteEnabled()) return;
  try {
    // Map the user data to match database schema (snake_case)
    const mappedUser = {
      id: user.id,
      username: user.username,
      password_hash: user.passwordHash,
      team_id: user.teamId, // Map teamId to team_id
      created_at: user.createdAt,
      last_login_at: user.lastLoginAt,
      is_admin: user.isAdmin,
    };
    
    await supabase.from(T_AUTH_USERS).upsert(mappedUser, { onConflict: 'id' });
  } catch (error) {
    console.warn('Failed to upsert auth user:', error);
  }
}

export async function getAuthUserByUsername(username: string): Promise<AuthRemoteUser | null> {
  if (!remoteEnabled()) return null;
  try {
    const { data, error } = await supabase
      .from(T_AUTH_USERS)
      .select('*')
      .eq('username', username)
      .maybeSingle();
    if (error) throw error;
    return (data as AuthRemoteUser) ?? null;
  } catch (error) {
    console.warn('Failed to fetch auth user:', error);
    return null;
  }
}

// --- Realtime sync (push-based) ---
let realtimeChannel: ReturnType<typeof supabase.channel> | undefined;
let manualSyncInterval: NodeJS.Timeout | undefined;

export function startRealtimeSync(): void {
  if (!remoteEnabled() || realtimeChannel) return;
  try {
    console.log('🔌 Starting realtime sync...');
    realtimeChannel = supabase
      .channel('realtime:bricktrack')
      .on('postgres_changes', { event: '*', schema: 'public', table: T_ENTRIES }, () => {
        // Pull latest so both tabs/devices stay in sync
        void syncAllToLocal();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: T_SPRINTS }, () => {
        void syncAllToLocal();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: T_TEAMS }, () => {
        void syncAllToLocal();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: T_USERS }, () => {
        void syncAllToLocal();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime sync connected successfully');
          // Clear manual sync interval since realtime is working
          if (manualSyncInterval) {
            clearInterval(manualSyncInterval);
            manualSyncInterval = undefined;
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Realtime sync failed - starting manual sync fallback');
          startManualSyncFallback();
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Realtime sync timed out - starting manual sync fallback');
          startManualSyncFallback();
        }
      });
  } catch (error) {
    console.warn('⚠️ Failed to start realtime sync - starting manual sync fallback:', error);
    startManualSyncFallback();
  }
}

function startManualSyncFallback(): void {
  if (manualSyncInterval) return; // Already running
  
  console.log('🔄 Starting manual sync fallback (every 30 seconds)...');
  manualSyncInterval = setInterval(() => {
    if (remoteEnabled()) {
      console.log('🔄 Manual sync triggered...');
      void syncAllToLocal();
    }
  }, 30000); // Sync every 30 seconds
}

export function stopRealtimeSync(): void {
  if (!realtimeChannel) return;
  try {
    console.log('🔌 Stopping realtime sync...');
    supabase.removeChannel(realtimeChannel);
  } catch (error) {
    console.warn('Failed to stop realtime sync:', error);
  } finally {
    realtimeChannel = undefined;
  }
  
  // Also stop manual sync
  if (manualSyncInterval) {
    clearInterval(manualSyncInterval);
    manualSyncInterval = undefined;
  }
}


