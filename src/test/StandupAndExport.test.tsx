import { describe, beforeEach, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { AuthProvider } from '@/contexts/AuthContext';
import { TeamStandupView } from '@/components/TeamStandupView';
import { SlackExport } from '@/components/SlackExport';
import TestApp from '@/test/TestApp';

function seedLocalData({ date }: { date: string }) {
  const user = {
    id: 'user-1',
    username: 'tester',
    name: 'Test User',
    teamId: 'development',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    isAdmin: true,
  };

  // App users list used by standup
  localStorage.setItem(
    'bricktrack_users',
    JSON.stringify([{ id: user.id, name: user.name, teamId: user.teamId }]),
  );

  // Teams
  localStorage.setItem(
    'bricktrack_teams',
    JSON.stringify([{ id: 'development', name: 'Development', color: '#3b82f6' }]),
  );

  // Current auth user for AuthProvider
  localStorage.setItem('bricktrack_current_user', JSON.stringify(user));

  // One standup entry for today
  localStorage.setItem(
    'bricktrack_entries',
    JSON.stringify([
      {
        id: `${user.id}-${date}`,
        userId: user.id,
        teamId: user.teamId,
        date,
        yesterdayTasks: [],
        todayTasks: [
          { id: 'task-1', text: 'Implement feature X', completed: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]),
  );
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

describe('Standup + SlackExport integration', () => {
  beforeEach(() => {
    localStorage.clear();
    seedLocalData({ date: today() });
  });

  it('renders today\'s tasks on TeamStandupView', () => {
    render(
      <TestApp>
        <AuthProvider>
          <TeamStandupView />
        </AuthProvider>
      </TestApp>,
    );

    // The task text should be visible under today
    expect(screen.getByText('Implement feature X')).toBeInTheDocument();
  });

  it('includes tasks in SlackExport for selected date', () => {
    render(
      <TestApp>
        <SlackExport />
      </TestApp>,
    );

    // Preview textarea includes the task
    const textarea = screen.getByRole('textbox');
    expect((textarea as HTMLTextAreaElement).value).toMatch(/Implement feature X/);
    // And the user mention header
    expect((textarea as HTMLTextAreaElement).value).toMatch(/@Test User/);
  });
});


