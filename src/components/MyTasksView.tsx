import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { BrickTrackStorage, formatDisplayDate, getToday, getYesterday } from '@/lib/storage';

import type { StandupEntry, Team, Task, Sprint } from '@/types/bricktrack';
import { CheckCircle, Clock, Plus, Edit3, Calendar, Target, Users, AlertCircle, X } from 'lucide-react';

export function MyTasksView() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [teams, setTeams] = useState<Team[]>([]);
  const [todayEntry, setTodayEntry] = useState<StandupEntry | null>(null);
  const [activeSprint, setActiveSprint] = useState<Sprint | undefined>();
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [incompletionReason, setIncompletionReason] = useState('');
  const [newEta, setNewEta] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [isEndOfDay, setIsEndOfDay] = useState(false);


  const today = getToday();
  const yesterday = getYesterday();

  const loadUserData = useCallback(() => {
    if (!user) return;

    let entry = BrickTrackStorage.getEntryForUserAndDate(user.id, today);

    // If no entry exists, create a basic one to sync with
    if (!entry) {
      entry = {
        id: `${user.id}-${today}`,
        userId: user.id,
        teamId: user.teamId,
        date: today,
        yesterdayTasks: [],
        todayTasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    setTodayEntry(entry);

    const sprint = BrickTrackStorage.getActiveSprintForTeam(user.teamId);
    setActiveSprint(sprint);

    // Check if it's end of day (after 4 PM)
    const currentHour = new Date().getHours();
    setIsEndOfDay(currentHour >= 16);
  }, [user, today]);

  useEffect(() => {
    const loadedTeams = BrickTrackStorage.getTeams();
    setTeams(loadedTeams);
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, loadUserData]);

  if (!user) {
    return null; // This shouldn't happen since we have auth protection
  }

  const updateTask = (taskId: string, updates: Partial<Task>, isYesterday: boolean = false) => {
    if (!todayEntry) return;

    const updatedEntry = {
      ...todayEntry,
      updatedAt: new Date().toISOString()
    };

    if (isYesterday) {
      updatedEntry.yesterdayTasks = updatedEntry.yesterdayTasks?.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      ) || [];
    } else {
      updatedEntry.todayTasks = updatedEntry.todayTasks?.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      ) || [];
    }

    // Save to storage so it syncs with standup
    BrickTrackStorage.saveEntry(updatedEntry);
    setTodayEntry(updatedEntry);
  };

  const addTodayTask = () => {
    if (!newTaskText.trim() || !todayEntry) return;

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: newTaskText.trim(),
      completed: false,
      sprintId: activeSprint?.id,
    };

    const updatedEntry = {
      ...todayEntry,
      todayTasks: [...(todayEntry.todayTasks || []), newTask],
      updatedAt: new Date().toISOString()
    };

    // Save to storage so it syncs with standup
    BrickTrackStorage.saveEntry(updatedEntry);
    setTodayEntry(updatedEntry);
    setNewTaskText('');

    toast({
      title: 'Task Added',
      description: 'New task added to today\'s list and synced with standup.',
    });
  };

  const removeTask = (taskId: string, isYesterday: boolean = false) => {
    if (!todayEntry) return;

    const updatedEntry = {
      ...todayEntry,
      updatedAt: new Date().toISOString()
    };

    if (isYesterday) {
      updatedEntry.yesterdayTasks = updatedEntry.yesterdayTasks?.filter(task => task.id !== taskId) || [];
    } else {
      updatedEntry.todayTasks = updatedEntry.todayTasks?.filter(task => task.id !== taskId) || [];
    }

    // Save to storage so it syncs with standup
    BrickTrackStorage.saveEntry(updatedEntry);
    setTodayEntry(updatedEntry);
  };

  const handleTaskCompletion = (task: Task, completed: boolean, isYesterday: boolean = false) => {
    if (completed) {
      setSelectedTask(task);
      setCompletionNotes('');
      setIncompletionReason('');
      setNewEta('');
      setShowCompletionDialog(true);
    } else {
      // Mark as incomplete
      updateTask(task.id, {
        completed: false,
        completedAt: undefined,
        notes: undefined
      }, isYesterday);
    }
  };

  const confirmTaskCompletion = () => {
    if (!selectedTask) return;

    const updates: Partial<Task> = {
      completed: true,
      completedAt: new Date().toISOString(),
      notes: completionNotes.trim() || undefined,
    };

    const isYesterday = todayEntry?.yesterdayTasks?.some(t => t.id === selectedTask.id);
    updateTask(selectedTask.id, updates, isYesterday);
    setShowCompletionDialog(false);
    setSelectedTask(null);

    toast({
      title: 'Task Completed! 🎉',
      description: 'Great job finishing that task!',
    });
  };

  const markIncomplete = () => {
    if (!selectedTask || !incompletionReason.trim()) return;

    const updates: Partial<Task> = {
      completed: false,
      incompletionReason: incompletionReason.trim(),
      newEta: newEta.trim() || undefined,
    };

    const isYesterday = todayEntry?.yesterdayTasks?.some(t => t.id === selectedTask.id);
    updateTask(selectedTask.id, updates, isYesterday);
    setShowCompletionDialog(false);
    setSelectedTask(null);

    toast({
      title: 'Task Updated',
      description: 'Task marked as incomplete with reasoning.',
    });
  };



  const yesterdayTasks = todayEntry?.yesterdayTasks || [];
  const todayTasks = todayEntry?.todayTasks || [];
  const completedYesterday = yesterdayTasks.filter(t => t.completed).length;
  const completedToday = todayTasks.filter(t => t.completed).length;

  // Calculate what the user needs to do
  const pendingYesterdayTasks = yesterdayTasks.filter(t => !t.completed).length;
  const pendingTodayTasks = todayTasks.filter(t => !t.completed).length;
  const hasNoTodayTasks = todayTasks.length === 0;

  // Determine primary action needed
  const getPrimaryAction = () => {
    if (hasNoTodayTasks) {
      return {
        title: "Plan Your Day",
        description: "Start by adding tasks for today",
        action: "Add your first task below",
        priority: "high"
      };
    }
    if (pendingYesterdayTasks > 0 && isEndOfDay) {
      return {
        title: "Update Yesterday's Progress",
        description: `${pendingYesterdayTasks} task${pendingYesterdayTasks > 1 ? 's' : ''} from yesterday need${pendingYesterdayTasks === 1 ? 's' : ''} status updates`,
        action: "Mark tasks as complete or provide reasons",
        priority: "urgent"
      };
    }
    if (pendingTodayTasks > 0) {
      return {
        title: "Focus on Today's Tasks",
        description: `${pendingTodayTasks} task${pendingTodayTasks > 1 ? 's' : ''} remaining for today`,
        action: "Complete your planned work",
        priority: "normal"
      };
    }
    return {
      title: "Great Progress!",
      description: "All tasks are up to date",
      action: "Plan tomorrow or add more tasks",
      priority: "low"
    };
  };

  const primaryAction = getPrimaryAction();

  return (
    <div className="space-y-6">
      {/* Action-Oriented Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Tasks</h1>
            <p className="text-muted-foreground">
              Your personal task management - add, edit, complete, and move tasks between days
            </p>
          </div>
          {teams.find(t => t.id === user.teamId) && (
            <Badge
              variant="outline"
              className="text-white border-0"
              style={{ backgroundColor: teams.find(t => t.id === user.teamId)?.color }}
            >
              {teams.find(t => t.id === user.teamId)?.name}
            </Badge>
          )}
        </div>

        {/* Primary Action Card - neutral surface to avoid glare in dark mode */}
        <Card className="border border-border bg-muted">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                primaryAction.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900/30' :
                primaryAction.priority === 'high' ? 'bg-blue-100 dark:bg-blue-900/30' :
                primaryAction.priority === 'normal' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                'bg-green-100 dark:bg-green-900/30'
              }`}>
                {primaryAction.priority === 'urgent' ? <AlertCircle className="h-6 w-6 text-red-600" /> :
                 primaryAction.priority === 'high' ? <Target className="h-6 w-6 text-blue-600" /> :
                 primaryAction.priority === 'normal' ? <Edit3 className="h-6 w-6 text-yellow-600" /> :
                 <CheckCircle className="h-6 w-6 text-green-600" />}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-1">{primaryAction.title}</h2>
                <p className="text-muted-foreground mb-2">{primaryAction.description}</p>
                <p className="text-sm font-medium">{primaryAction.action}</p>
                {activeSprint && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Target className="h-3 w-3 mr-1" />
                      {activeSprint.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Active Sprint
                    </span>
                  </div>
                )}
              </div>
              {isEndOfDay && (
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                  <Clock className="h-3 w-3 mr-1" />
                  End of Day
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Today's Tasks - Priority #1 */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Edit3 className="h-6 w-6" />
              Today's Focus ({formatDisplayDate(today)})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {completedToday}/{todayTasks.length} Complete
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                Synced with Standup
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {hasNoTodayTasks ? 'Start by planning what you want to accomplish today' :
             pendingTodayTasks > 0 ? `${pendingTodayTasks} task${pendingTodayTasks > 1 ? 's' : ''} remaining` :
             'All tasks completed! 🎉'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add new task - prominently placed */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Add a new task:</Label>
              <div className="flex gap-2">
                <Textarea
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder={hasNoTodayTasks ? "What's your main goal for today?" : "Add another task..."}
                  className="flex-1"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addTodayTask();
                    }
                  }}
                />
                <Button
                  onClick={addTodayTask}
                  disabled={!newTaskText.trim()}
                  size="sm"
                  className="px-4"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {/* Today's tasks list */}
            {todayTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground/90">
                  <span>Your tasks for today:</span>
                </div>
                {todayTasks.map((task) => (
                  <div key={task.id} className={`flex items-start gap-3 p-4 border rounded-lg transition-colors ${
                    task.completed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/40' : 'bg-card border-border hover:border-accent/40'
                  }`}>
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={(checked) =>
                        handleTaskCompletion(task, checked as boolean, false)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <Textarea
                        value={task.text}
                        onChange={(e) => updateTask(task.id, { text: e.target.value }, false)}
                        className={`border-none p-0 h-auto text-sm focus-visible:ring-0 resize-none ${
                          task.completed ? 'line-through text-muted-foreground' : ''
                        }`}
                        rows={1}
                      />

                      {task.completed && task.notes && (
                        <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                          <strong>Completion notes:</strong> {task.notes}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 items-center">
                        {task.completed && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Done
                          </Badge>
                        )}
                        {task.sprintId && activeSprint?.id === task.sprintId && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                            <Target className="h-3 w-3 mr-1" />
                            Sprint Goal
                          </Badge>
                        )}
                        {task.assignedUsers && task.assignedUsers.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {task.assignedUsers.length} tagged
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTask(task.id, false)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {todayTasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-1">Ready to start your day?</p>
                <p className="text-sm">Add your first task above to get focused and productive!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Yesterday's Tasks - Only show if there are any */}
      {yesterdayTasks.length > 0 && (
        <Card className={pendingYesterdayTasks > 0 ? "border-orange-200 bg-orange-50" : ""}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Yesterday's Tasks ({formatDisplayDate(yesterday)})
              {pendingYesterdayTasks > 0 && (
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                  {pendingYesterdayTasks} need updates
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {pendingYesterdayTasks > 0 ?
                'Please update the status of incomplete tasks' :
                'All tasks from yesterday are updated'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {yesterdayTasks.map((task) => (
                <div key={task.id} className={`flex items-start gap-3 p-3 border rounded-lg ${
                  !task.completed ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'
                }`}>
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) =>
                      handleTaskCompletion(task, checked as boolean, true)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <Textarea
                      value={task.text}
                      onChange={(e) => updateTask(task.id, { text: e.target.value }, true)}
                      className={`border-none p-0 h-auto text-sm focus-visible:ring-0 resize-none ${
                        task.completed ? 'line-through text-gray-500' : ''
                      }`}
                      rows={1}
                    />

                    {task.completed && task.notes && (
                      <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                        <strong>Notes:</strong> {task.notes}
                      </div>
                    )}

                    {!task.completed && task.incompletionReason && (
                      <div className="text-xs text-red-700 bg-red-100 p-2 rounded">
                        <strong>Reason:</strong> {task.incompletionReason}
                        {task.newEta && <div><strong>New ETA:</strong> {task.newEta}</div>}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 items-center">
                      {task.completed && (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {task.sprintId && activeSprint?.id === task.sprintId && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          <Target className="h-3 w-3 mr-1" />
                          Sprint Goal
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTask(task.id, true)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}



      {/* Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedYesterday}</div>
              <div className="text-sm text-muted-foreground">Completed Yesterday</div>
              <div className="text-xs text-gray-500">of {yesterdayTasks.length} planned</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completedToday}</div>
              <div className="text-sm text-muted-foreground">Completed Today</div>
              <div className="text-xs text-gray-500">of {todayTasks.length} planned</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((completedToday / Math.max(todayTasks.length, 1)) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Progress Today</div>
              <div className="text-xs text-gray-500">
                {pendingTodayTasks} task{pendingTodayTasks !== 1 ? 's' : ''} remaining
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* End of Day Reminder */}
      {isEndOfDay && (pendingYesterdayTasks > 0 || pendingTodayTasks > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              End of Day Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-orange-700">
              <p>Before you finish for the day:</p>
              <ul className="space-y-1 ml-4">
                {pendingYesterdayTasks > 0 && (
                  <li>• Update completion status for {pendingYesterdayTasks} task{pendingYesterdayTasks > 1 ? 's' : ''} from yesterday</li>
                )}
                {pendingTodayTasks > 0 && (
                  <li>• Mark today's completed tasks and provide reasons for incomplete ones</li>
                )}
                <li>• Plan tomorrow's tasks so you can jump right in</li>
              </ul>
              <p className="mt-3 font-medium">
                This helps you start tomorrow stress-free and focused! 🎯
              </p>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Task Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTask && (
              <div>
                <h3 className="font-medium mb-2">Task: {selectedTask.text}</h3>

                <div className="space-y-4">
                  <div>
                    <Button
                      onClick={confirmTaskCompletion}
                      className="w-full mb-3"
                      size="lg"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Completed
                    </Button>

                    <div className="space-y-2">
                      <Label className="text-sm">Add completion notes (optional)</Label>
                      <Textarea
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                        placeholder="Any notes about how you completed this task..."
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Or mark as incomplete:</h4>
                    <div className="space-y-2">
                      <Label className="text-sm">Why wasn't this completed? *</Label>
                      <Textarea
                        value={incompletionReason}
                        onChange={(e) => setIncompletionReason(e.target.value)}
                        placeholder="Explain what prevented completion..."
                        rows={2}
                      />

                      <Label className="text-sm">When will this be completed?</Label>
                      <Input
                        value={newEta}
                        onChange={(e) => setNewEta(e.target.value)}
                        placeholder="Tomorrow, Next week, After X is done..."
                      />

                      <Button
                        onClick={markIncomplete}
                        disabled={!incompletionReason.trim()}
                        variant="outline"
                        className="w-full"
                      >
                        Mark as Incomplete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}