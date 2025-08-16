// BrickTrack - Team Standup Tracking App

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createHead, UnheadProvider } from '@unhead/react/client';
import { InferSeoMetaPlugin } from '@unhead/addons';
import { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/auth/AuthPage';
import { AppProvider } from '@/components/AppProvider';
import AppRouter from './AppRouter';
import { useEffect } from 'react';
import { syncAllToLocal, startRealtimeSync, stopRealtimeSync } from '@/lib/remoteSync';
import { checkTablesExist, ensureTablesExist } from '@/lib/supabaseSetup';
import { DebugInfo } from '@/components/DebugInfo';
import { SupabaseTest } from '@/components/SupabaseTest';

const head = createHead({
  plugins: [
    InferSeoMetaPlugin(),
  ],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      gcTime: Infinity,
    },
  },
});

function AppContent() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // On app mount, check if tables exist and then sync data
    const initializeSupabase = async () => {
      try {
        // First check if tables exist
        const tablesExist = await checkTablesExist();
        
        if (!tablesExist) {
          console.log('📋 Tables do not exist, attempting to create them...');
          
          // Try to create tables (this will likely fail but provide instructions)
          const tablesCreated = await ensureTablesExist();
          
          if (!tablesCreated) {
            console.error('❌ Cannot create tables automatically. Please create them manually in Supabase dashboard.');
            console.error('📋 Go to your Supabase project → SQL Editor and run the SQL from the console logs.');
            
            // Show a user-friendly message
            alert('Supabase tables need to be created manually. Check the browser console for SQL instructions.');
            
            // Still try to sync in case tables get created manually
            await syncAllToLocal();
            startRealtimeSync();
            return;
          }
        }
        
        console.log('✅ Supabase tables ready, starting sync...');
        // Now sync data from remote
        await syncAllToLocal();
        // Start realtime sync
        startRealtimeSync();
        
      } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
        // Fallback to local-only mode
        await syncAllToLocal();
        startRealtimeSync();
      }
    };

    initializeSupabase();
    
    return () => stopRealtimeSync();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading BrickTrack...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <AppRouter />
      <DebugInfo />
      <SupabaseTest />
    </>
  );
}

export function App() {
  return (
    <UnheadProvider head={head}>
      <QueryClientProvider client={queryClient}>
        <AppProvider
          storageKey="bricktrack_app_config"
          defaultConfig={{ theme: 'dark', relayUrl: 'wss://relay.nostr.band' }}
        >
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Suspense>
                <AppContent />
              </Suspense>
            </TooltipProvider>
          </AuthProvider>
        </AppProvider>
      </QueryClientProvider>
    </UnheadProvider>
  );
}

export default App;
