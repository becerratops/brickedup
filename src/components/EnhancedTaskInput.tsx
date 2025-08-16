import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Plus, AlertCircle, Calendar, Users, ArrowRight } from 'lucide-react';
import type { Task, Sprint, User } from '@/types/bricktrack';

interface EnhancedTaskInputProps {
  tasks: Task[];
  onChange: (tasks: Task[]) => void;
  title: string;
  placeholder: string;
  allowCompletion?: boolean;
  activeSprint?: Sprint;
  users?: User[];
  isFirstTime?: boolean;
  incompleteTasks?: Task[]; // Tasks from previous days
  className?: string;
}

export function EnhancedTaskInput({
  tasks,
  onChange,
  title,
  placeholder,
  allowCompletion = false,
  activeSprint,
  users = [],
  isFirstTime = false,
  incompleteTasks = [],
  className = ''
}: EnhancedTaskInputProps) {
  const [newTaskText, setNewTaskText] = useState('');
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
  const [selectedIncompleteTask, setSelectedIncompleteTask] = useState<Task | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addTask = () => {
    if (!newTaskText.trim()) return;

    // Check if pasted content has bullet points and split
    const lines = newTaskText.split('\n').filter(line => line.trim());
    const newTasks: Task[] = [];

    lines.forEach(line => {
      // Remove common bullet point formats
      const cleanedLine = line.replace(/^[\s]*[-•*]\s*/, '').trim();
      if (cleanedLine) {
        const newTask: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: cleanedLine,
          completed: false,
          sprintId: activeSprint?.id,
        };
        newTasks.push(newTask);
      }
    });

    if (newTasks.length > 0) {
      onChange([...tasks, ...newTasks]);
    }
    setNewTaskText('');
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    onChange(tasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const removeTask = (taskId: string) => {
    onChange(tasks.filter(task => task.id !== taskId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTask();
    }
  };

  const handleIncompleteTaskAction = (task: Task, action: 'complete' | 'move') => {
    if (action === 'complete') {
      // Mark as completed
      const updatedTask = {
        ...task,
        completed: true,
        completedAt: new Date().toISOString()
      };
      onChange([...tasks, updatedTask]);
    } else if (action === 'move') {
      // Move to today with reason
      setSelectedIncompleteTask(task);
      setShowIncompleteDialog(true);
    }
  };

  const confirmMoveTask = (reason: string, newEta: string) => {
    if (selectedIncompleteTask) {
      const movedTask = {
        ...selectedIncompleteTask,
        id: `${selectedIncompleteTask.id}-moved-${Date.now()}`,
        incompletionReason: reason,
        newEta: newEta || undefined,
        movedFromDate: new Date().toISOString().split('T')[0],
      };
      onChange([...tasks, movedTask]);
      setShowIncompleteDialog(false);
      setSelectedIncompleteTask(null);
    }
  };

  const addUserTag = (taskId: string, userId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const currentTags = task.assignedUsers || [];
      if (!currentTags.includes(userId)) {
        updateTask(taskId, { assignedUsers: [...currentTags, userId] });
      }
    }
  };

  const removeUserTag = (taskId: string, userId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const currentTags = task.assignedUsers || [];
      updateTask(taskId, { assignedUsers: currentTags.filter(id => id !== userId) });
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">{title}</Label>
        {isFirstTime && (
          <Badge variant="outline" className="text-xs">
            First time? Just add what you plan to do today!
          </Badge>
        )}
      </div>

      {/* Active Sprint Context */}
      {activeSprint && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Current Sprint: {activeSprint.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeSprint.goals.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Sprint Goals:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {activeSprint.goals.map((goal, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-blue-600">•</span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeSprint.backlogItems && activeSprint.backlogItems.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Selected Backlog Items:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {activeSprint.backlogItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-blue-600">•</span>
                      <span className="break-all">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeSprint.taskBreakdown && activeSprint.taskBreakdown.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Task Breakdown:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {activeSprint.taskBreakdown.map((task, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-blue-600">•</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Incomplete Tasks from Previous Days */}
      {incompleteTasks.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-4 w-4" />
              Incomplete Tasks from Previous Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {incompleteTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.text}</p>
                    {task.movedFromDate && (
                      <p className="text-xs text-gray-500">From: {task.movedFromDate}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleIncompleteTaskAction(task, 'complete')}
                      className="text-xs"
                    >
                      Mark Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleIncompleteTaskAction(task, 'move')}
                      className="text-xs"
                    >
                      Move to Today
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Tasks */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id} className="p-3">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                {allowCompletion && (
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) => {
                      const updates: Partial<Task> = {
                        completed: checked as boolean
                      };
                      if (checked) {
                        updates.completedAt = new Date().toISOString();
                      }
                      updateTask(task.id, updates);
                    }}
                    className="mt-1"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={task.text}
                    onChange={(e) => updateTask(task.id, { text: e.target.value })}
                    className="border-none p-0 h-auto text-sm focus-visible:ring-0 resize-none"
                    placeholder="Task description..."
                    rows={1}
                    style={{ minHeight: '20px' }}
                  />

                  {/* Task metadata */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {task.sprintId && activeSprint?.id === task.sprintId && (
                      <Badge variant="secondary" className="text-xs">
                        Sprint Task
                      </Badge>
                    )}
                    {task.movedFromDate && (
                      <Badge variant="outline" className="text-xs">
                        Moved from {task.movedFromDate}
                      </Badge>
                    )}
                    {task.completed && task.completedAt && (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        ✓ Completed
                      </Badge>
                    )}
                  </div>

                  {/* User tags */}
                  {task.assignedUsers && task.assignedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {task.assignedUsers.map(userId => {
                        const user = users.find(u => u.id === userId);
                        return user ? (
                          <Badge
                            key={userId}
                            variant="outline"
                            className="text-xs flex items-center gap-1"
                          >
                            <Users className="h-3 w-3" />
                            {user.name}
                            <button
                              onClick={() => removeUserTag(task.id, userId)}
                              className="ml-1 hover:text-red-600"
                            >
                              ×
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Tag users */}
                  {users.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(userId) => addUserTag(task.id, userId)}>
                        <SelectTrigger className="w-32 h-6 text-xs">
                          <SelectValue placeholder="Tag user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.filter(u => !task.assignedUsers?.includes(u.id)).map(user => (
                            <SelectItem key={user.id} value={user.id} className="text-xs">
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Notes field for completed tasks */}
                  {task.completed && (
                    <Textarea
                      value={task.notes || ''}
                      onChange={(e) => updateTask(task.id, { notes: e.target.value })}
                      placeholder="Add notes about completion..."
                      rows={2}
                      className="text-xs"
                    />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTask(task.id)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Incompletion Details */}
              {allowCompletion && !task.completed && task.incompletionReason && (
                <div className="pl-6 space-y-2 border-l-2 border-red-200 bg-red-50 p-2 rounded">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Not completed</span>
                  </div>
                  <Textarea
                    value={task.incompletionReason}
                    onChange={(e) => updateTask(task.id, { incompletionReason: e.target.value })}
                    placeholder="Why wasn't this completed?"
                    rows={2}
                    className="text-sm"
                  />
                  <Input
                    value={task.newEta || ''}
                    onChange={(e) => updateTask(task.id, { newEta: e.target.value })}
                    placeholder="New ETA (e.g., 'Tomorrow', '8/15', 'Next sprint')"
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add New Task */}
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`${placeholder}\n\nTip: Paste bulleted lists to auto-create multiple tasks!`}
          className="min-h-[60px]"
          rows={3}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Press Enter to add • Use bullet points (-,•,*) for multiple tasks
          </p>
          <Button
            onClick={addTask}
            disabled={!newTaskText.trim()}
            size="sm"
            className="px-4"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Task{newTaskText.includes('\n') ? 's' : ''}
          </Button>
        </div>
      </div>

      {/* Move Task Dialog */}
      <Dialog open={showIncompleteDialog} onOpenChange={setShowIncompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Task to Today</DialogTitle>
          </DialogHeader>
          <MoveTaskForm
            task={selectedIncompleteTask}
            onConfirm={confirmMoveTask}
            onCancel={() => setShowIncompleteDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MoveTaskForm({
  task,
  onConfirm,
  onCancel
}: {
  task: Task | null;
  onConfirm: (reason: string, newEta: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const [newEta, setNewEta] = useState('');

  if (!task) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium">Task: {task.text}</h3>
        <p className="text-sm text-muted-foreground">
          Why wasn't this completed yesterday?
        </p>
      </div>

      <div className="space-y-2">
        <Label>Reason (required)</Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain what prevented completion..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>New ETA (optional)</Label>
        <Input
          value={newEta}
          onChange={(e) => setNewEta(e.target.value)}
          placeholder="When will this be completed? (e.g., 'Today', '8/15', 'Next sprint')"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          onClick={() => onConfirm(reason, newEta)}
          disabled={!reason.trim()}
          className="flex-1"
        >
          <ArrowRight className="h-4 w-4 mr-1" />
          Move to Today
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}