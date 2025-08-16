import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { remoteEnabled } from '@/lib/supabaseUtils';

export function DebugInfo() {
  const supabaseConfigured = isSupabaseConfigured();
  const remoteEnabledStatus = remoteEnabled();
  
  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="font-semibold mb-2">Debug Info</h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Supabase Configured:</span>
          <span className={supabaseConfigured ? 'text-green-500' : 'text-red-500'}>
            {supabaseConfigured ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Remote Sync:</span>
          <span className={remoteEnabledStatus ? 'text-green-500' : 'text-red-500'}>
            {remoteEnabledStatus ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Environment:</span>
          <span className="text-blue-500">
            {import.meta.env.MODE}
          </span>
        </div>
        {!supabaseConfigured && (
          <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">
            <strong>Missing Environment Variables:</strong>
            <br />
            VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}
            <br />
            VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}
          </div>
        )}
      </div>
    </div>
  );
}
