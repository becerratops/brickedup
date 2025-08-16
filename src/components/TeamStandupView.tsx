import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { BrickTrackStorage, formatDisplayDate, getToday } from '@/lib/storage';
import type { StandupEntry, User, Team, Sprint } from '@/types/bricktrack';
import { Users, CheckCircle, Clock, Target, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

export function TeamStandupView() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<StandupEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getToday());
  const [activeSprint, setActiveSprint] = useState<Sprint | undefined>();

  useEffect(() => {
    setEntries(BrickTrackStorage.getEntries());
    setUsers(BrickTrackStorage.getUsers());
    setTeams(BrickTrackStorage.getTeams());

    // Default to user's team if logged in, otherwise first team
    const loadedTeams = BrickTrackStorage.getTeams();
    if (user && user.teamId) {
      setSelectedTeam(user.teamId);
    } else if (loadedTeams.length > 0) {
      setSelectedTeam(loadedTeams[0].id);
    }
  }, [user]);

  useEffect(() => {
    if (selectedTeam) {
      const sprint = BrickTrackStorage.getActiveSprintForTeam(selectedTeam);
      setActiveSprint(sprint);
    }
  }, [selectedTeam]);

  const teamEntries = entries.filter(entry =>
    entry.teamId === selectedTeam && entry.date === selectedDate
  );

  const teamUsers = users.filter(user => user.teamId === selectedTeam);
  const selectedTeamData = teams.find(t => t.id === selectedTeam);

  // Get unique dates for date selection
  const availableDates = Array.from(new Set(entries.map(entry => entry.date)))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 14); // Last 14 days

  const getUserEntry = (userId: string) => {
    return teamEntries.find(entry => entry.userId === userId);
  };

  const getTaskStats = (entry: StandupEntry) => {
    const completedYesterday = entry.yesterdayTasks?.filter(t => t.completed).length || 0;
    const totalYesterday = entry.yesterdayTasks?.length || 0;
    const todayTasks = entry.todayTasks?.length || 0;

    return { completedYesterday, totalYesterday, todayTasks };
  };

  // Calculate sprint progress
  const getSprintProgress = () => {
    if (!activeSprint) return null;

    const sprintTasks = teamEntries.flatMap(entry => [
      ...(entry.yesterdayTasks?.filter(t => t.sprintId === activeSprint.id) || []),
      ...(entry.todayTasks?.filter(t => t.sprintId === activeSprint.id) || [])
    ]);

    const completedTasks = sprintTasks.filter(t => t.completed).length;
    const totalTasks = sprintTasks.length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return { completedTasks, totalTasks, progressPercentage };
  };

  const sprintProgress = getSprintProgress();

  // Get team blockers
  const getTeamBlockers = () => {
    return teamEntries
      .filter(entry => entry.blockers && entry.blockers.trim())
      .map(entry => ({
        user: users.find(u => u.id === entry.userId),
        blockers: entry.blockers
      }));
  };

  const teamBlockers = getTeamBlockers();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Standup</h1>
          <p className="text-muted-foreground">Sprint progress & team updates</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDisplayDate(selectedDate)}
          </Badge>
        </div>
      </div>

      {/* Sprint Progress - Prominent */}
      {activeSprint ? (
        <Card className="border border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Target className="h-6 w-6" />
                {activeSprint.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                {sprintProgress && (
                  <Badge variant="default" className="bg-blue-600">
                    {sprintProgress.progressPercentage}% Complete
                  </Badge>
                )}
                <Button variant="outline" size="sm" asChild>
                  <a href="/sprint-planning">Edit Sprint</a>
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDisplayDate(activeSprint.startDate)} - {formatDisplayDate(activeSprint.endDate)}
              </span>
              {sprintProgress && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {sprintProgress.completedTasks}/{sprintProgress.totalTasks} tasks done
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Sprint Goals:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeSprint.goals.map((goal, index) => (
                     <div key={index} className="flex items-start gap-2 bg-card p-3 rounded border border-border">
                    <span className="text-blue-600 font-bold">{index + 1}.</span>
                    <span className="text-sm">{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-8 text-center">
            <Target className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Active Sprint</h3>
            <p className="text-muted-foreground mb-4">
              Create a sprint to track team goals and progress.
            </p>
            <Button asChild>
              <a href="/sprint-planning">Create Sprint</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Team Blockers - If any */}
      {teamBlockers.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Team Blockers ({teamBlockers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamBlockers.map((blocker, index) => (
                <div key={index} className="bg-card p-3 rounded border border-red-200">
                  <div className="font-medium text-sm text-red-800 mb-1">
                    {blocker.user?.name}:
                  </div>
                  <p className="text-sm text-gray-700">{blocker.blockers}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        {team.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map(date => (
                    <SelectItem key={date} value={date}>
                      {formatDisplayDate(date)}
                      {date === getToday() && ' (Today)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {teamUsers.map(teamUser => {
          const entry = getUserEntry(teamUser.id);
          const stats = entry ? getTaskStats(entry) : null;

          return (
            <Card key={teamUser.id} className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                      <span className="font-semibold text-gray-700">
                        {teamUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{teamUser.name}</h3>
                      {selectedTeamData && (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: `${selectedTeamData.color}20`,
                            color: selectedTeamData.color
                          }}
                        >
                          {selectedTeamData.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {stats && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {stats.completedYesterday}/{stats.totalYesterday} done
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {stats.todayTasks} today
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {entry ? (
                  <>
                    {/* Yesterday's Tasks */}
                    {entry.yesterdayTasks && entry.yesterdayTasks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2 text-sm">✅ Yesterday:</h4>
                        <div className="space-y-1">
                          {entry.yesterdayTasks.map((task, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              {task.completed ? (
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              ) : (
                                <Clock className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              )}
                              <span className={task.completed ? 'text-gray-600' : 'text-gray-800'}>
                                {task.text}
                              </span>
                              {task.sprintId === activeSprint?.id && (
                                <Badge variant="outline" className="text-xs bg-secondary text-secondary-foreground">
                                  Sprint
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Today's Tasks */}
                    {entry.todayTasks && entry.todayTasks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2 text-sm">🎯 Today:</h4>
                        <div className="space-y-1">
                          {entry.todayTasks.map((task, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <div className="h-4 w-4 border-2 border-blue-300 rounded mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{task.text}</span>
                              {task.sprintId === activeSprint?.id && (
                                <Badge variant="outline" className="text-xs bg-secondary text-secondary-foreground">
                                  Sprint
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Blockers */}
                    {entry.blockers && (
                      <div>
                        <h4 className="font-medium text-red-700 mb-2 text-sm flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          🚫 Blockers:
                        </h4>
                        <p className="text-sm text-gray-700 bg-red-50 p-3 rounded border-l-4 border-red-300">
                          {entry.blockers}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No update for {formatDisplayDate(selectedDate)}</p>
                    <p className="text-xs text-muted-foreground">
                      {teamUser.name} hasn't logged their standup yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Team Summary */}
      {teamEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{teamEntries.length}</div>
                <div className="text-sm text-muted-foreground">Members Updated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {teamEntries.reduce((total, entry) =>
                    total + (entry.yesterdayTasks?.filter(t => t.completed).length || 0), 0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Tasks Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {teamEntries.reduce((total, entry) =>
                    total + (entry.todayTasks?.length || 0), 0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Tasks Planned</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {teamBlockers.length}
                </div>
                <div className="text-sm text-muted-foreground">Blockers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}