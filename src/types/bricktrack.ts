export interface Task {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string; // ISO timestamp when completed
  incompletionReason?: string;
  newEta?: string; // Simple date string or description
  sprintId?: string; // Link to sprint
  notes?: string; // Additional notes added during completion
  movedFromDate?: string; // If moved from previous day
  assignedUsers?: string[]; // For tagging team members
}

export interface StandupEntry {
  id: string;
  userId: string;
  teamId: string;
  date: string; // YYYY-MM-DD format
  yesterdayTasks: Task[];
  todayTasks: Task[];
  blockers?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface User {
  id: string;
  name: string;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
}

export interface Sprint {
  id: string;
  teamId: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  goals: string[];
  backlogItems: string[]; // URLs or ticket IDs
  taskBreakdown: string[];
  capacityPlanning?: string;
  risks?: string;
  notes?: string;
  isActive: boolean;
}

export interface DelayedTask {
  userId: string;
  userName: string;
  task: string;
  dayCount: number;
  firstDate: string;
  latestDate: string;
  sprintId?: string;
}

export interface SlackExportData {
  userId: string;
  userName: string;
  done: string[];
  today: string[];
  blockers?: string;
}