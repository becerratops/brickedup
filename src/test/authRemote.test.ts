import { describe, it, expect, beforeEach, vi } from 'vitest';

// Minimal replica of simpleHash used in auth.ts for test data
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Mocks for remoteSync functions used by AuthService
type RemoteAuthUser = {
  id: string; username: string; name: string; email?: string; teamId: string; createdAt: string; lastLoginAt: string; isAdmin?: boolean; passwordHash: string;
};

vi.mock('@/lib/remoteSync', () => {
  const getAuthUserByUsername = vi.fn(async (): Promise<RemoteAuthUser | null> => null);
  const upsertAuthUser = vi.fn(async (): Promise<void> => undefined);
  const pushUsers = vi.fn(async (): Promise<void> => undefined);
  return { getAuthUserByUsername, upsertAuthUser, pushUsers };
});

import { AuthService } from '@/lib/auth';
import * as remote from '@/lib/remoteSync';

describe('AuthService remote auth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('logs in using remote auth table when available', async () => {
    const password = 'pass1234';
    const passwordHash = simpleHash(password);
    vi.spyOn(remote, 'getAuthUserByUsername').mockResolvedValueOnce({
      id: 'user-remote-1',
      username: 'tester',
      name: 'Tester',
      email: 't@example.com',
      teamId: 'development',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isAdmin: false,
      passwordHash,
    } as unknown as {
      id: string; username: string; name: string; email: string; teamId: string; createdAt: string; lastLoginAt: string; isAdmin: boolean; passwordHash: string;
    });

    const user = await AuthService.login({ username: 'tester', password });
    expect(user.username).toBe('tester');
    // Ensure local migration/upsert was attempted
    expect(remote.pushUsers).toHaveBeenCalled();
  });

  it('signs up and upserts remote auth table', async () => {
    const user = await AuthService.signup({
      username: 'newuser',
      password: 'mysecret',
      name: 'New User',
      teamId: 'development',
      email: 'n@example.com',
    });
    expect(user.username).toBe('newuser');
    expect(remote.upsertAuthUser).toHaveBeenCalled();
    expect(remote.pushUsers).toHaveBeenCalled();
  });
});


