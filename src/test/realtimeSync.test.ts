import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock supabase client realtime API with factory inside vi.mock
vi.mock('@/lib/supabaseClient', () => {
  const channelOn = vi.fn().mockReturnThis();
  const channelSubscribe = vi.fn().mockReturnThis();
  const channel = vi.fn(() => ({ on: channelOn, subscribe: channelSubscribe }));
  const removeChannel = vi.fn();
  return { supabase: { channel, removeChannel }, isSupabaseConfigured: () => true };
});

import { startRealtimeSync, stopRealtimeSync } from '@/lib/remoteSync';
import { supabase } from '@/lib/supabaseClient';

type MockChannel = {
  on: (...args: unknown[]) => MockChannel;
  subscribe: (...args: unknown[]) => MockChannel;
};
type MockSupabase = {
  channel: { mock: { results: { value: MockChannel }[] } } & ((...args: unknown[]) => MockChannel);
  removeChannel: { mock: { calls: unknown[][] } } & ((...args: unknown[]) => unknown);
};

describe('Realtime sync wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to postgres_changes on start', () => {
    startRealtimeSync();
    const s = supabase as unknown as MockSupabase;
    expect(s.channel).toHaveBeenCalled();
    const ch = s.channel.mock.results[0].value;
    expect(ch.on).toHaveBeenCalled();
    expect(ch.subscribe).toHaveBeenCalled();
  });

  it('removes channel on stop', () => {
    startRealtimeSync();
    stopRealtimeSync();
    expect((supabase as unknown as MockSupabase).removeChannel).toHaveBeenCalled();
  });
});


