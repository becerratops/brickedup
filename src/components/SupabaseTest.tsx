import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { syncAllToLocal, pushUsers } from '@/lib/remoteSync';
import { checkTablesExist, ensureTablesExist } from '@/lib/supabaseSetup';
import { BrickTrackStorage } from '@/lib/storage';
import { AuthService } from '@/lib/auth';
import { T_USERS } from '@/lib/supabaseUtils';
import type { User } from '@/types/bricktrack';

export function SupabaseTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSupabaseConnection = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Check configuration
      addResult('🔧 Testing Supabase configuration...');
      const configured = isSupabaseConfigured();
      addResult(`Configuration: ${configured ? '✅ OK' : '❌ FAILED'}`);
      
      if (!configured) {
        addResult('❌ Supabase not configured. Check your .env file.');
        return;
      }

      // Test 2: Test basic connection
      addResult('🔗 Testing Supabase connection...');
      const { data, error } = await supabase.from(T_USERS).select('count').limit(1);
      
      if (error) {
        addResult(`❌ Connection failed: ${error.message}`);
        return;
      }
      
      addResult('✅ Supabase connection successful');

      // Test 3: Check if tables exist
      addResult('📋 Checking if tables exist...');
      const tablesExist = await checkTablesExist();
      
      if (!tablesExist) {
        addResult('❌ Tables do not exist');
        addResult('📋 Attempting to create tables...');
        
        const tablesCreated = await ensureTablesExist();
        
        if (!tablesCreated) {
          addResult('❌ Cannot create tables automatically');
          addResult('📋 Please create them manually in Supabase dashboard');
          addResult('🔗 Go to: SQL Editor → Run the SQL from console logs');
          return;
        } else {
          addResult('✅ Tables created successfully');
        }
      } else {
        addResult('✅ Tables already exist');
      }

      // Test 4: Test data sync
      addResult('📥 Testing data sync from remote...');
      await syncAllToLocal();
      addResult('✅ Data sync completed');

      // Test 5: Check local storage after sync
      addResult('📊 Checking local storage after sync...');
      const localUsers = BrickTrackStorage.getUsers();
      const localEntries = BrickTrackStorage.getEntries();
      const localTeams = BrickTrackStorage.getTeams();
      
      addResult(`Local users: ${localUsers.length}`);
      addResult(`Local entries: ${localEntries.length}`);
      addResult(`Local teams: ${localTeams.length}`);

      // Test 6: Test pushing data to remote
      addResult('📤 Testing data push to remote...');
      const testUser: User = {
        id: 'test-user-' + Date.now(),
        name: 'Test User',
        teamId: 'development'
      };
      
      await pushUsers([testUser]);
      addResult('✅ Test user pushed to remote');

      // Test 7: Verify data was saved
      addResult('🔍 Verifying data was saved...');
      const { data: savedUser, error: fetchError } = await supabase
        .from(T_USERS)
        .select('*')
        .eq('id', testUser.id)
        .single();
      
      if (fetchError) {
        addResult(`❌ Failed to fetch saved user: ${fetchError.message}`);
      } else {
        addResult(`✅ User saved successfully: ${savedUser.name}`);
      }

      addResult('🎉 All tests completed!');

    } catch (error) {
      addResult(`❌ Test failed with error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const manualSync = async () => {
    addResult('🔄 Manual sync triggered...');
    try {
      await syncAllToLocal();
      addResult('✅ Manual sync completed');
    } catch (error) {
      addResult(`❌ Manual sync failed: ${error}`);
    }
  };

  const clearOrphanedUsers = async () => {
    addResult('🧹 Clearing orphaned users...');
    try {
      await AuthService.clearOrphanedUsers();
      addResult('✅ Orphaned users cleared');
      addResult('💡 Try creating your account again now');
    } catch (error) {
      addResult(`❌ Failed to clear orphaned users: ${error}`);
    }
  };

  const clearAllData = async () => {
    addResult('🗑️ Clearing all local data...');
    try {
      // Clear all localStorage
      localStorage.clear();
      addResult('✅ All local data cleared');
      addResult('🔄 Refreshing page...');
      // Refresh the page to reset everything
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      addResult(`❌ Failed to clear data: ${error}`);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <div className="fixed bottom-4 left-4 bg-background border rounded-lg p-4 shadow-lg max-w-md max-h-96 overflow-y-auto">
      <h3 className="font-semibold mb-2">Supabase Test Panel</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={testSupabaseConnection}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Run Tests'}
        </button>
        
        <button
          onClick={manualSync}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm ml-2"
        >
          Manual Sync
        </button>
        
        <button
          onClick={clearOrphanedUsers}
          className="px-3 py-1 bg-orange-500 text-white rounded text-sm ml-2"
        >
          Clear Orphaned
        </button>
        
        <button
          onClick={clearAllData}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm ml-2"
        >
          Clear All Data
        </button>

        <button
          onClick={clearTestResults}
          className="px-3 py-1 bg-gray-500 text-white rounded text-sm ml-2"
        >
          Clear
        </button>
      </div>

      <div className="text-xs space-y-1">
        {testResults.map((result, index) => (
          <div key={index} className="font-mono">
            {result}
          </div>
        ))}
        
        {testResults.length === 0 && (
          <div className="text-muted-foreground">
            Click "Run Tests" to test your Supabase setup
          </div>
        )}
      </div>
    </div>
  );
}
