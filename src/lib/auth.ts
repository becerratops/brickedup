import type { AuthUser, LoginCredentials, SignupData } from '@/types/auth';
import { pushUsers, upsertAuthUser, getAuthUserByUsername } from '@/lib/remoteSync';
import { BrickTrackStorage } from '@/lib/storage';

const STORAGE_KEYS = {
  USERS: 'bricktrack_auth_users',
  CURRENT_USER: 'bricktrack_current_user',
} as const;

// Simple password hashing (for demo - use proper hashing in production)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

interface StoredUser extends AuthUser {
  passwordHash: string;
}

export class AuthService {
  static getStoredUsers(): StoredUser[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  static saveUsers(users: StoredUser[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  static getCurrentUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading current user:', error);
      return null;
    }
  }

  static setCurrentUser(user: AuthUser | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (error) {
      console.error('Error setting current user:', error);
    }
  }

  static async login(credentials: LoginCredentials): Promise<AuthUser> {
    const { username, password } = credentials;

    if (!username.trim() || !password.trim()) {
      throw new Error('Username and password are required');
    }

    const passwordHash = simpleHash(password);

    // Try remote auth first (shared across devices)
    const remoteUser = await getAuthUserByUsername(username.toLowerCase());
    let user: StoredUser | undefined;

    if (remoteUser && remoteUser.passwordHash === passwordHash) {
      user = { ...remoteUser } as unknown as StoredUser;
    } else {
      // Fallback to local auth for offline/demo
      const users = this.getStoredUsers();
      user = users.find(u =>
        u.username.toLowerCase() === username.toLowerCase() &&
        u.passwordHash === passwordHash
      );
    }

    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Update last login
    const updatedUser: AuthUser = {
      ...user,
      lastLoginAt: new Date().toISOString(),
    };

    // Remove password hash from returned user
    const { passwordHash: _, ...userWithoutPassword } = user;
    const finalUser = { ...userWithoutPassword, lastLoginAt: updatedUser.lastLoginAt };

    // Only save locally if we used local storage; remote path doesn't need this but harmless
    const usersLocal = this.getStoredUsers();
    const existingIndex = usersLocal.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      usersLocal[existingIndex] = { ...user, lastLoginAt: updatedUser.lastLoginAt } as StoredUser;
      this.saveUsers(usersLocal);
    }
    this.setCurrentUser(finalUser);
    // Ensure user exists in local app users list for standup view
    try {
      const usersList = BrickTrackStorage.getUsers();
      const exists = usersList.some(u => u.id === finalUser.id);
      if (!exists) {
        usersList.push({ id: finalUser.id, name: finalUser.name, teamId: finalUser.teamId });
        BrickTrackStorage.saveUsers(usersList);
      }
    } catch {
      // ignore
    }
    // Push to remote users table to ensure presence
    void pushUsers([finalUser]);
    // Migrate legacy local-only accounts to remote auth for cross-device sign-in
    await upsertAuthUser({ ...(finalUser as AuthUser), passwordHash } as unknown as {
      id: string; username: string; email?: string; name: string; teamId: string; createdAt: string; lastLoginAt: string; isAdmin?: boolean; passwordHash: string;
    });

    return finalUser;
  }

  static async signup(data: SignupData): Promise<AuthUser> {
    const { username, password, name, email, teamId } = data;

    if (!username.trim() || !password.trim() || !name.trim() || !teamId) {
      throw new Error('All fields are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const users = this.getStoredUsers();

    // Check if username already exists
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('Username already exists');
    }

    // Check if email already exists (if provided)
    if (email && users.some(u => u.email?.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already exists');
    }

    const newUser: StoredUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username: username.trim(),
      email: email?.trim(),
      name: name.trim(),
      teamId,
      passwordHash: simpleHash(password),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isAdmin: users.length === 0 || username.toLowerCase() === 'admin' || name.toLowerCase().includes('admin'), // First user or admin username becomes admin
    };

    users.push(newUser);
    this.saveUsers(users);

    // Remove password hash from returned user
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    this.setCurrentUser(userWithoutPassword);
    // Ensure user exists in local app users list for standup view
    try {
      const usersList = BrickTrackStorage.getUsers();
      const exists = usersList.some(u => u.id === userWithoutPassword.id);
      if (!exists) {
        usersList.push({ id: userWithoutPassword.id, name: userWithoutPassword.name, teamId: userWithoutPassword.teamId });
        BrickTrackStorage.saveUsers(usersList);
      }
    } catch {
      // ignore
    }
    void pushUsers([userWithoutPassword]);
    // Store in remote auth table for cross-device sign-in
    await upsertAuthUser({ ...(userWithoutPassword as AuthUser), passwordHash: newUser.passwordHash } as unknown as {
      id: string; username: string; email?: string; name: string; teamId: string; createdAt: string; lastLoginAt: string; isAdmin?: boolean; passwordHash: string;
    });

    return userWithoutPassword;
  }

  static logout(): void {
    this.setCurrentUser(null);
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Not logged in');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    const users = this.getStoredUsers();
    const user = users.find(u => u.id === currentUser.id);

    if (!user) {
      throw new Error('User not found');
    }

    const currentPasswordHash = simpleHash(currentPassword);
    if (user.passwordHash !== currentPasswordHash) {
      throw new Error('Current password is incorrect');
    }

    const newPasswordHash = simpleHash(newPassword);
    const updatedUsers = users.map(u =>
      u.id === currentUser.id ? { ...u, passwordHash: newPasswordHash } : u
    );

    this.saveUsers(updatedUsers);
  }

  static deleteAccount(): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Not logged in');
    }

    const users = this.getStoredUsers();
    const updatedUsers = users.filter(u => u.id !== currentUser.id);
    this.saveUsers(updatedUsers);
    this.logout();
  }

  static deleteUser(userId: string): void {
    const users = this.getStoredUsers();
    const updatedUsers = users.filter(u => u.id !== userId);
    this.saveUsers(updatedUsers);
    void pushUsers(updatedUsers);
  }

  static getAllUsers(): AuthUser[] {
    return this.getStoredUsers().map(({ passwordHash: _, ...user }) => user);
  }

  static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}