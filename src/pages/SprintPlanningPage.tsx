import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { BrickTrackStorage, formatDisplayDate } from '@/lib/storage';
import type { Sprint, Team } from '@/types/bricktrack';
import { Target, Plus, Calendar, Archive, Edit3, X, Users, CheckCircle } from 'lucide-react';

export function SprintPlanningPage() {
  const { toast } = useToast();
  const { user } = useAuth();
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

  const loadData = useCallback(() => {
    if (!user) return;

    const loadedTeams = BrickTrackStorage.getTeams();
    const loadedSprints = BrickTrackStorage.getSprintsForTeam(user.teamId);
    const active = BrickTrackStorage.getActiveSprintForTeam(user.teamId);

    setTeams(loadedTeams);
    setSprints(loadedSprints);
    setActiveSprint(active);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const createSprint = () => {
    if (!newSprintData.name.trim() || !newSprintData.startDate || !newSprintData.endDate || !user) {
      toast({
        title: 'Error',
        description: 'Please fill in sprint name, start date, and end date.',
        variant: 'destructive',
      });
      return;
    }

    // Deactivate other sprints for this team
    const existingSprints = BrickTrackStorage.getSprintsForTeam(user.teamId);
    existingSprints.forEach(sprint => {
      if (sprint.isActive) {
        BrickTrackStorage.saveSprint({ ...sprint, isActive: false });
      }
    });

    const newSprint: Sprint = {
      id: `sprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      teamId: user.teamId,
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
    loadData();
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

    toast({
      title: 'Sprint Created! 🎯',
      description: `${newSprint.name} is now your active sprint.`,
    });
  };

  const updateSprintGoal = (index: number, value: string) => {
    if (!activeSprint) return;

    const updatedSprint = {
      ...activeSprint,
      goals: activeSprint.goals.map((goal, i) => i === index ? value : goal)
    };

    BrickTrackStorage.saveSprint(updatedSprint);
    loadData();
  };

  const addSprintGoal = () => {
    if (!activeSprint) return;

    const updatedSprint = {
      ...activeSprint,
      goals: [...activeSprint.goals, '']
    };

    BrickTrackStorage.saveSprint(updatedSprint);
    loadData();
  };

  const removeSprintGoal = (index: number) => {
    if (!activeSprint || activeSprint.goals.length <= 1) return;

    const updatedSprint = {
      ...activeSprint,
      goals: activeSprint.goals.filter((_, i) => i !== index)
    };

    BrickTrackStorage.saveSprint(updatedSprint);
    loadData();
  };

  const archiveSprint = (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    const updatedSprint = { ...sprint, isActive: false };
    BrickTrackStorage.saveSprint(updatedSprint);
    loadData();

    toast({
      title: 'Sprint Archived',
      description: `${sprint.name} has been archived.`,
    });
  };

  const activateSprint = (sprintId: string) => {
    if (!user) return;

    // Deactivate current active sprint
    if (activeSprint) {
      BrickTrackStorage.saveSprint({ ...activeSprint, isActive: false });
    }

    // Activate selected sprint
    const sprint = sprints.find(s => s.id === sprintId);
    if (sprint) {
      BrickTrackStorage.saveSprint({ ...sprint, isActive: true });
      loadData();

      toast({
        title: 'Sprint Activated! 🚀',
        description: `${sprint.name} is now your active sprint.`,
      });
    }
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

  if (!user) {
    return null;
  }

  const selectedTeam = teams.find(t => t.id === user.teamId);
  const archivedSprints = sprints.filter(s => !s.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sprint Planning</h1>
          <p className="text-muted-foreground">
            Create and manage sprint goals for your team
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              New Sprint
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Sprint</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                <Label>Sprint Name *</Label>
                <Input
                  value={newSprintData.name}
                  onChange={(e) => setNewSprintData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Sprint 1, Q1 Goals, MVP Launch"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={newSprintData.startDate}
                    onChange={(e) => setNewSprintData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
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
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={addGoal} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Goal
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Capacity Planning</Label>
                <Textarea
                  value={newSprintData.capacityPlanning}
                  onChange={(e) => setNewSprintData(prev => ({ ...prev, capacityPlanning: e.target.value }))}
                  placeholder="Team capacity, availability, planned time off..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Risks & Dependencies</Label>
                <Textarea
                  value={newSprintData.risks}
                  onChange={(e) => setNewSprintData(prev => ({ ...prev, risks: e.target.value }))}
                  placeholder="Potential blockers, dependencies, risks..."
                  rows={2}
                />
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

      {/* Team Context */}
      {selectedTeam && (
        <Card className="bg-muted border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: selectedTeam.color }}>
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{selectedTeam.name} Team</h2>
                <p className="text-sm text-muted-foreground">
                  Managing sprints and goals for your team
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Sprint */}
      {activeSprint ? (
        <Card className="border border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Target className="h-6 w-6" />
                Active Sprint: {activeSprint.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600">
                  Active
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => archiveSprint(activeSprint.id)}
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDisplayDate(activeSprint.startDate)} - {formatDisplayDate(activeSprint.endDate)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Sprint Goals (Click to edit):
                </h4>
                <div className="space-y-2">
                  {activeSprint.goals.map((goal, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-green-600 mt-2">•</span>
                      <Input
                        value={goal}
                        onChange={(e) => updateSprintGoal(index, e.target.value)}
                        className="text-sm"
                        placeholder="Sprint goal..."
                      />
                      {activeSprint.goals.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSprintGoal(index)}
                          className="h-10 w-10 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addSprintGoal}
                    className="text-green-700 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-900/20"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Goal
                  </Button>
                </div>
              </div>

              {activeSprint.capacityPlanning && (
                <div>
                  <h4 className="font-medium mb-2">Capacity Planning:</h4>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                    {activeSprint.capacityPlanning}
                  </p>
                </div>
              )}

              {activeSprint.risks && (
                <div>
                  <h4 className="font-medium mb-2">Risks & Dependencies:</h4>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                    {activeSprint.risks}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-12 text-center">
            <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Active Sprint</h3>
            <p className="text-muted-foreground mb-4">
              Create a new sprint to start planning and tracking your team's goals.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Sprint
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Archived Sprints */}
      {archivedSprints.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Archived Sprints ({archivedSprints.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Previous sprints for reference and reactivation
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {archivedSprints.map((sprint) => (
                <div key={sprint.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <div className="flex-1">
                    <h4 className="font-medium">{sprint.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDisplayDate(sprint.startDate)} - {formatDisplayDate(sprint.endDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {sprint.goals.length} goals
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => activateSprint(sprint.id)}
                  >
                    Reactivate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}