import { BrickTrackStorage } from './storage';
import { AuthService } from './auth';
import type { StandupEntry } from '@/types/bricktrack';

export class DataMigration {
  /**
   * Associate existing standup data with a new user account
   * This is useful when someone signs up and wants to claim existing data
   */
  static associateDataWithUser(oldUserId: string, newUserId: string): boolean {
    try {
      // Get all entries for the old user ID
      const allEntries = BrickTrackStorage.getEntries();
      const oldUserEntries = allEntries.filter(entry => entry.userId === oldUserId);

      if (oldUserEntries.length === 0) {
        return false; // No data to migrate
      }

      // Update all entries to use the new user ID
      const updatedEntries = allEntries.map(entry => {
        if (entry.userId === oldUserId) {
          return {
            ...entry,
            userId: newUserId,
            updatedAt: new Date().toISOString()
          };
        }
        return entry;
      });

      // Save the updated entries
      localStorage.setItem('bricktrack_entries', JSON.stringify(updatedEntries));

      return true;
    } catch (error) {
      console.error('Error migrating data:', error);
      return false;
    }
  }

  /**
   * Get a list of orphaned data (entries without corresponding auth users)
   */
  static getOrphanedData(): { userId: string; entryCount: number; latestEntry: string }[] {
    try {
      const allEntries = BrickTrackStorage.getEntries();
      const authUsers = AuthService.getAllUsers();
      const authUserIds = new Set(authUsers.map(u => u.id));

      // Group entries by user ID
      const entriesByUser = allEntries.reduce((acc, entry) => {
        if (!authUserIds.has(entry.userId)) {
          if (!acc[entry.userId]) {
            acc[entry.userId] = [];
          }
          acc[entry.userId].push(entry);
        }
        return acc;
      }, {} as Record<string, StandupEntry[]>);

      // Convert to summary format
      return Object.entries(entriesByUser).map(([userId, entries]) => ({
        userId,
        entryCount: entries.length,
        latestEntry: entries.sort((a, b) => b.date.localeCompare(a.date))[0]?.date || 'Unknown'
      }));
    } catch (error) {
      console.error('Error getting orphaned data:', error);
      return [];
    }
  }

  /**
   * Clean up orphaned data (remove entries for users that don't exist)
   */
  static cleanupOrphanedData(): number {
    try {
      const allEntries = BrickTrackStorage.getEntries();
      const authUsers = AuthService.getAllUsers();
      const authUserIds = new Set(authUsers.map(u => u.id));

      const validEntries = allEntries.filter(entry => authUserIds.has(entry.userId));
      const removedCount = allEntries.length - validEntries.length;

      if (removedCount > 0) {
        localStorage.setItem('bricktrack_entries', JSON.stringify(validEntries));
      }

      return removedCount;
    } catch (error) {
      console.error('Error cleaning up orphaned data:', error);
      return 0;
    }
  }

  /**
   * Auto-associate data for obvious matches (same name, case insensitive)
   */
  static autoAssociateObviousMatches(): number {
    try {
      const orphanedData = this.getOrphanedData();
      const authUsers = AuthService.getAllUsers();
      let associatedCount = 0;

      orphanedData.forEach(orphaned => {
        // Try to find exact name match (case insensitive)
        const matchingUser = authUsers.find(user =>
          user.name.toLowerCase() === orphaned.userId.toLowerCase()
        );

        if (matchingUser) {
          const success = this.associateDataWithUser(orphaned.userId, matchingUser.id);
          if (success) {
            associatedCount++;
          }
        }
      });

      return associatedCount;
    } catch (error) {
      console.error('Error auto-associating data:', error);
      return 0;
    }
  }

  /**
   * Get suggested associations based on name matching
   */
  static getSuggestedAssociations(): { orphanedUserId: string; suggestedAuthUser: { id: string; name: string; email?: string } }[] {
    try {
      const orphanedData = this.getOrphanedData();
      const authUsers = AuthService.getAllUsers();
      const suggestions: { orphanedUserId: string; suggestedAuthUser: { id: string; name: string; email?: string } }[] = [];

      orphanedData.forEach(orphaned => {
        // Try to match by name (case insensitive)
        const matchingUser = authUsers.find(user =>
          user.name.toLowerCase() === orphaned.userId.toLowerCase() ||
          user.username.toLowerCase() === orphaned.userId.toLowerCase()
        );

        if (matchingUser) {
          suggestions.push({
            orphanedUserId: orphaned.userId,
            suggestedAuthUser: {
              id: matchingUser.id,
              name: matchingUser.name,
              email: matchingUser.email
            }
          });
        }
      });

      return suggestions;
    } catch (error) {
      console.error('Error getting suggested associations:', error);
      return [];
    }
  }
}