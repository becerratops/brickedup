import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, AlertCircle } from 'lucide-react';
import type { Task, Sprint } from '@/types/bricktrack';

interface TaskInputProps {
  tasks: Task[];
  onChange: (tasks: Task[]) => void;
  title: string;
  placeholder: string;
  allowCompletion?: boolean;
  activeSprint?: Sprint;
  className?: string;
}

export function TaskInput({
  tasks,
  onChange,
  title,
  placeholder,
  allowCompletion = false,
  activeSprint,
  className = ''
}: TaskInputProps) {
  const [newTaskText, setNewTaskText] = useState('');

  const addTask = () => {
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: newTaskText.trim(),
      completed: false,
      sprintId: activeSprint?.id,
    };

    onChange([...tasks, newTask]);
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

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-base font-medium">{title}</Label>

      {/* Active Sprint Indicator */}
      {activeSprint && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            Sprint: {activeSprint.name}
          </Badge>
          <span>
            {new Date(activeSprint.startDate).toLocaleDateString()} - {new Date(activeSprint.endDate).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Existing Tasks */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <Card key={task.id} className="p-3">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                {allowCompletion && (
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) =>
                      updateTask(task.id, { completed: checked as boolean })
                    }
                    className="mt-1"
                  />
                )}
                <div className="flex-1">
                  <Input
                    value={task.text}
                    onChange={(e) => updateTask(task.id, { text: e.target.value })}
                    className="border-none p-0 h-auto text-sm focus-visible:ring-0"
                    placeholder="Task description..."
                  />
                  {task.sprintId && activeSprint?.id === task.sprintId && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      Sprint Task
                    </Badge>
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
                    placeholder="New ETA (optional)"
                    className="text-sm"
                  />
                </div>
              )}

              {/* Show incompletion form when task is marked incomplete */}
              {allowCompletion && !task.completed && !task.incompletionReason && (
                <div className="pl-6 space-y-2">
                  <Label className="text-sm text-red-600">Why wasn't this completed?</Label>
                  <Textarea
                    value={task.incompletionReason || ''}
                    onChange={(e) => updateTask(task.id, { incompletionReason: e.target.value })}
                    placeholder="Explain what prevented completion..."
                    rows={2}
                    className="text-sm"
                  />
                  <Input
                    value={task.newEta || ''}
                    onChange={(e) => updateTask(task.id, { newEta: e.target.value })}
                    placeholder="New ETA (optional)"
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add New Task */}
      <div className="flex gap-2">
        <Input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          onClick={addTask}
          disabled={!newTaskText.trim()}
          size="sm"
          className="px-3"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}