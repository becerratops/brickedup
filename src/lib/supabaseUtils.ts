import { supabase, isSupabaseConfigured } from './supabaseClient';

// Table names
export const T_ENTRIES = 'bt_entries';
export const T_SPRINTS = 'bt_sprints';
export const T_TEAMS = 'bt_teams';
export const T_USERS = 'bt_users'; // app/platform users, not auth providers
export const T_AUTH_USERS = 'bt_auth_users'; // demo auth table for cross-device username/password

export function remoteEnabled(): boolean {
  const enabled = isSupabaseConfigured();
  console.log('🔗 Remote sync enabled:', enabled);
  return enabled;
}

// Helper function to check if we should attempt remote operations
export function shouldAttemptRemote(): boolean {
  return remoteEnabled() && supabase !== undefined;
}
