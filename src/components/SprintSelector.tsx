import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BrickTrackStorage, formatDisplayDate } from '@/lib/storage';
import type { Sprint, Team } from '@/types/bricktrack';
import { Calendar, Plus, Target, X } from 'lucide-react';

interface SprintSelectorProps {
  selectedTeamId: string;
  onSprintChange?: (sprint: Sprint | undefined) => void;
  className?: string;
}

export function SprintSelector({ selectedTeamId, onSprintChange, className = '' }: SprintSelectorProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | undefined>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSprintData, setNewSprintData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    goals: [''],
    backlogItems: [''],
    taskBreakdown: [''],
    capacityPlanning: '',
    risks: '',
    notes: '',
  });

  useEffect(() => {
    setTeams(BrickTrackStorage.getTeams());
    loadSprints();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      const active = BrickTrackStorage.getActiveSprintForTeam(selectedTeamId);
      setActiveSprint(active);
      onSprintChange?.(active);
    }
  }, [selectedTeamId, sprints, onSprintChange]);

  const loadSprints = () => {
    setSprints(BrickTrackStorage.getSprints());
  };

  const createSprint = () => {
    if (!newSprintData.name.trim() || !newSprintData.startDate || !newSprintData.endDate) {
      return;
    }

    // Deactivate other sprints for this team
    const existingSprints = BrickTrackStorage.getSprintsForTeam(selectedTeamId);
    existingSprints.forEach(sprint => {
      if (sprint.isActive) {
        BrickTrackStorage.saveSprint({ ...sprint, isActive: false });
      }
    });

    const newSprint: Sprint = {
      id: `sprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      teamId: selectedTeamId,
      name: newSprintData.name.trim(),
      startDate: newSprintData.startDate,
      endDate: newSprintData.endDate,
      goals: newSprintData.goals.filter(goal => goal.trim()).map(goal => goal.trim()),
      backlogItems: newSprintData.backlogItems.filter(item => item.trim()).map(item => item.trim()),
      taskBreakdown: newSprintData.taskBreakdown.filter(task => task.trim()).map(task => task.trim()),
      capacityPlanning: newSprintData.capacityPlanning.trim() || undefined,
      risks: newSprintData.risks.trim() || undefined,
      notes: newSprintData.notes.trim() || undefined,
      isActive: true,
    };

    BrickTrackStorage.saveSprint(newSprint);
    loadSprints();
    setIsCreateDialogOpen(false);
    setNewSprintData({
      name: '',
      startDate: '',
      endDate: '',
      goals: [''],
      backlogItems: [''],
      taskBreakdown: [''],
      capacityPlanning: '',
      risks: '',
      notes: '',
    });
  };

  const addGoal = () => {
    setNewSprintData(prev => ({
      ...prev,
      goals: [...prev.goals, '']
    }));
  };

  const updateGoal = (index: number, value: string) => {
    setNewSprintData(prev => ({
      ...prev,
      goals: prev.goals.map((goal, i) => i === index ? value : goal)
    }));
  };

  const removeGoal = (index: number) => {
    setNewSprintData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  const updateSprintGoal = (index: number, value: string) => {
    if (!activeSprint) return;

    const updatedSprint = {
      ...activeSprint,
      goals: activeSprint.goals.map((goal, i) => i === index ? value : goal)
    };

    BrickTrackStorage.saveSprint(updatedSprint);
    loadSprints();
  };

  const addSprintGoal = () => {
    if (!activeSprint) return;

    const updatedSprint = {
      ...activeSprint,
      goals: [...activeSprint.goals, '']
    };

    BrickTrackStorage.saveSprint(updatedSprint);
    loadSprints();
  };

  const removeSprintGoal = (index: number) => {
    if (!activeSprint || activeSprint.goals.length <= 1) return;

    const updatedSprint = {
      ...activeSprint,
      goals: activeSprint.goals.filter((_, i) => i !== index)
    };

    BrickTrackStorage.saveSprint(updatedSprint);
    loadSprints();
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  if (!selectedTeamId) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Current Sprint
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                New Sprint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Sprint</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Sprint Name</Label>
                  <Input
                    value={newSprintData.name}
                    onChange={(e) => setNewSprintData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Sprint 1, Q1 Goals, MVP Launch"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newSprintData.startDate}
                      onChange={(e) => setNewSprintData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newSprintData.endDate}
                      onChange={(e) => setNewSprintData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sprint Goals</Label>
                  {newSprintData.goals.map((goal, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={goal}
                        onChange={(e) => updateGoal(index, e.target.value)}
                        placeholder={`Goal ${index + 1}`}
                      />
                      {newSprintData.goals.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGoal(index)}
                          className="px-2"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={addGoal} className="w-full">
                    + Add Goal
                  </Button>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={createSprint} className="flex-1">
                    Create Sprint
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {activeSprint ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{activeSprint.name}</h3>
              <Badge
                variant="default"
                style={{ backgroundColor: selectedTeam?.color }}
              >
                {selectedTeam?.name}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDisplayDate(activeSprint.startDate)} - {formatDisplayDate(activeSprint.endDate)}
              </span>
            </div>

            {activeSprint.goals.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Sprint Goals:</h4>
                <div className="space-y-2">
                  {activeSprint.goals.map((goal, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <Input
                        value={goal}
                        onChange={(e) => updateSprintGoal(index, e.target.value)}
                        className="text-sm border-none p-0 h-auto focus-visible:ring-1 focus-visible:ring-primary"
                        placeholder="Sprint goal..."
                      />
                      {activeSprint.goals.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSprintGoal(index)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addSprintGoal}
                    className="text-xs h-6"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Goal
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active sprint for {selectedTeam?.name}</p>
            <p className="text-xs">Create a new sprint to start tracking goals</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}