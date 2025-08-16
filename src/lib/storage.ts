import type { StandupEntry, User, Team, Sprint } from '@/types/bricktrack';
import { pushEntry, pushSprint, pushTeams, pushUsers } from '@/lib/remoteSync';

const STORAGE_KEYS = {
  ENTRIES: 'bricktrack_entries',
  USERS: 'bricktrack_users',
  TEAMS: 'bricktrack_teams',
  SPRINTS: 'bricktrack_sprints',
} as const;

// Default teams
const DEFAULT_TEAMS: Team[] = [
  { id: 'development', name: 'Development', color: '#3b82f6' },
  { id: 'marketing', name: 'Marketing', color: '#10b981' },
];

// Default team members (empty for privacy; no real names pre-seeded)
const DEFAULT_USERS: User[] = [];

export class BrickTrackStorage {
  // Migration helper for old data format
  static migrateOldEntries(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (!stored) return;

      const entries = JSON.parse(stored);
      let needsMigration = false;

      const migratedEntries = entries.map((entry: StandupEntry & { yesterdayPlan?: string; todayPlan?: string; completed?: boolean; incompletionReason?: string; newEta?: string }) => {
        // Check if this is old format (has yesterdayPlan/todayPlan strings)
        if (typeof entry.yesterdayPlan === 'string') {
          needsMigration = true;
          return {
            ...entry,
            teamId: entry.teamId || 'development', // Default to development team
            yesterdayTasks: entry.yesterdayPlan ? [{
              id: `${entry.id}-yesterday-1`,
              text: entry.yesterdayPlan,
              completed: entry.completed || false,
              incompletionReason: entry.incompletionReason,
              newEta: entry.newEta,
            }] : [],
            todayTasks: entry.todayPlan ? [{
              id: `${entry.id}-today-1`,
              text: entry.todayPlan,
              completed: false,
            }] : [],
            // Remove old fields
            yesterdayPlan: undefined,
            todayPlan: undefined,
            completed: undefined,
            incompletionReason: undefined,
            newEta: undefined,
          };
        }
        return entry;
      });

      if (needsMigration) {
        localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(migratedEntries));
      }
    } catch (error) {
      console.error('Error migrating entries:', error);
    }
  }

  static getEntries(): StandupEntry[] {
    try {
      this.migrateOldEntries();
      const stored = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading entries:', error);
      return [];
    }
  }

  static saveEntry(entry: StandupEntry): void {
    try {
      const entries = this.getEntries();
      const existingIndex = entries.findIndex(
        e => e.userId === entry.userId && e.date === entry.date
      );

      if (existingIndex >= 0) {
        entries[existingIndex] = { ...entry, updatedAt: new Date().toISOString() };
      } else {
        entries.push(entry);
      }

      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      // Fire-and-forget remote upsert
      void pushEntry(entry);
    } catch (error) {
      console.error('Error saving entry:', error);
      throw new Error('Failed to save entry');
    }
  }

  static getTeams(): Team[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TEAMS);
      const teams = stored ? JSON.parse(stored) : DEFAULT_TEAMS;

      // Ensure default teams are always present
      const teamIds = teams.map((t: Team) => t.id);
      const missingDefaults = DEFAULT_TEAMS.filter(
        defaultTeam => !teamIds.includes(defaultTeam.id)
      );

      if (missingDefaults.length > 0) {
        const updatedTeams = [...teams, ...missingDefaults];
        this.saveTeams(updatedTeams);
        return updatedTeams;
      }

      return teams;
    } catch (error) {
      console.error('Error loading teams:', error);
      return DEFAULT_TEAMS;
    }
  }

  static saveTeams(teams: Team[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
      void pushTeams(teams);
    } catch (error) {
      console.error('Error saving teams:', error);
    }
  }

  static getUsers(): User[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      const users = stored ? JSON.parse(stored) : DEFAULT_USERS;

      // Migrate users without teamId
      const migratedUsers = users.map((user: User & { teamId?: string }) => ({
        ...user,
        teamId: user.teamId || 'development', // Default to development team
      }));

      // Ensure default users are always present
      const userNames = migratedUsers.map((u: User) => u.name.toLowerCase());
      const missingDefaults = DEFAULT_USERS.filter(
        defaultUser => !userNames.includes(defaultUser.name.toLowerCase())
      );

      if (missingDefaults.length > 0) {
        const updatedUsers = [...migratedUsers, ...missingDefaults];
        this.saveUsers(updatedUsers);
        return updatedUsers;
      }

      return migratedUsers;
    } catch (error) {
      console.error('Error loading users:', error);
      return DEFAULT_USERS;
    }
  }

  static saveUsers(users: User[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      void pushUsers(users);
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  static addUser(name: string, teamId: string = 'development'): User {
    const users = this.getUsers();
    const id = name.toLowerCase().replace(/\s+/g, '-');

    // Check if user already exists
    const existing = users.find(u => u.id === id);
    if (existing) {
      return existing;
    }

    const newUser: User = { id, name, teamId };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  static getSprints(): Sprint[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SPRINTS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading sprints:', error);
      return [];
    }
  }

  static saveSprint(sprint: Sprint): void {
    try {
      const sprints = this.getSprints();
      const existingIndex = sprints.findIndex(s => s.id === sprint.id);

      if (existingIndex >= 0) {
        sprints[existingIndex] = sprint;
      } else {
        sprints.push(sprint);
      }

      localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(sprints));
      void pushSprint(sprint);
    } catch (error) {
      console.error('Error saving sprint:', error);
      throw new Error('Failed to save sprint');
    }
  }

  static getActiveSprintForTeam(teamId: string): Sprint | undefined {
    return this.getSprints().find(s => s.teamId === teamId && s.isActive);
  }

  static getSprintsForTeam(teamId: string): Sprint[] {
    return this.getSprints()
      .filter(s => s.teamId === teamId)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }

  static getEntriesForUser(userId: string): StandupEntry[] {
    return this.getEntries()
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  static getEntriesForDate(date: string): StandupEntry[] {
    return this.getEntries()
      .filter(entry => entry.date === date)
      .sort((a, b) => a.userId.localeCompare(b.userId));
  }

  static getEntriesForTeam(teamId: string): StandupEntry[] {
    return this.getEntries()
      .filter(entry => entry.teamId === teamId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  static getEntryForUserAndDate(userId: string, date: string): StandupEntry | undefined {
    return this.getEntries().find(entry => entry.userId === userId && entry.date === date);
  }

  static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.TEAMS);
    localStorage.removeItem(STORAGE_KEYS.SPRINTS);
  }

  static generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDate(yesterday);
}

export function getToday(): string {
  return formatDate(new Date());
}