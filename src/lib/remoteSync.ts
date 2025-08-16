import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type { StandupEntry, Sprint, Team, User } from '@/types/bricktrack';
import type { AuthUser } from '@/types/auth';

// Table names
const T_ENTRIES = 'bt_entries';
const T_SPRINTS = 'bt_sprints';
const T_TEAMS = 'bt_teams';
const T_USERS = 'bt_users'; // app/platform users, not auth providers
const T_AUTH_USERS = 'bt_auth_users'; // demo auth table for cross-device username/password

export function remoteEnabled(): boolean {
  return isSupabaseConfigured();
}

// One-time or periodic pull of all remote data into localStorage
export async function syncAllToLocal(): Promise<void> {
  if (!remoteEnabled()) return;

  try {
    const [entriesRes, sprintsRes, teamsRes, usersRes] = await Promise.all([
      supabase.from(T_ENTRIES).select('*'),
      supabase.from(T_SPRINTS).select('*'),
      supabase.from(T_TEAMS).select('*'),
      supabase.from(T_USERS).select('*'),
    ]);

    if (entriesRes.data) {
      // Data shape is already aligned to StandupEntry
      localStorage.setItem('bricktrack_entries', JSON.stringify(entriesRes.data as StandupEntry[]));
    }
    if (sprintsRes.data) {
      localStorage.setItem('bricktrack_sprints', JSON.stringify(sprintsRes.data as Sprint[]));
    }
    if (teamsRes.data) {
      localStorage.setItem('bricktrack_teams', JSON.stringify(teamsRes.data as Team[]));
    }
    if (usersRes.data) {
      localStorage.setItem('bricktrack_users', JSON.stringify(usersRes.data as User[]));
    }
  } catch (error) {
    console.warn('Remote sync failed:', error);
  }
}

export async function pushEntry(entry: StandupEntry): Promise<void> {
  if (!remoteEnabled()) return;
  try {
    await supabase.from(T_ENTRIES).upsert(entry, { onConflict: 'id' });
  } catch (error) {
    console.warn('Failed to push entry:', error);
  }
}

export async function pushSprint(sprint: Sprint): Promise<void> {
  if (!remoteEnabled()) return;
  try {
    await supabase.from(T_SPRINTS).upsert(sprint, { onConflict: 'id' });
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
  // Normalize to app User shape (id, name, teamId)
  const mapped: User[] = users.map((u: Partial<User & AuthUser>) => ({
    id: String(u.id ?? ''),
    name: u.name ?? u.username ?? 'User',
    teamId: u.teamId ?? 'development',
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
    await supabase.from(T_AUTH_USERS).upsert(user, { onConflict: 'id' });
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

export function startRealtimeSync(): void {
  if (!remoteEnabled() || realtimeChannel) return;
  try {
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
      .subscribe();
  } catch (error) {
    console.warn('Failed to start realtime sync:', error);
  }
}

export function stopRealtimeSync(): void {
  if (!realtimeChannel) return;
  try {
    supabase.removeChannel(realtimeChannel);
  } catch (error) {
    console.warn('Failed to stop realtime sync:', error);
  } finally {
    realtimeChannel = undefined;
  }
}


