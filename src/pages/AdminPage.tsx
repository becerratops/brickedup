import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { AuthService } from '@/lib/auth';
import { BrickTrackStorage } from '@/lib/storage';
import { DataMigration } from '@/lib/dataMigration';
import type { AuthUser } from '@/types/auth';
import type { Team } from '@/types/bricktrack';
import { Users, Mail, Plus, Shield, Trash2, UserCheck, UserX, Database, Link } from 'lucide-react';

export function AdminPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<AuthUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    name: '',
    teamId: '',
    password: '',
  });
  const [orphanedData, setOrphanedData] = useState<{ userId: string; entryCount: number; latestEntry: string }[]>([]);
  const [suggestedAssociations, setSuggestedAssociations] = useState<{ orphanedUserId: string; suggestedAuthUser: { id: string; name: string; email?: string } }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const users = AuthService.getAllUsers();
    const loadedTeams = BrickTrackStorage.getTeams();
    const orphaned = DataMigration.getOrphanedData();
    const suggestions = DataMigration.getSuggestedAssociations();

    setAllUsers(users);
    setTeams(loadedTeams);
    setOrphanedData(orphaned);
    setSuggestedAssociations(suggestions);
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const inviteUser = async () => {
    if (!inviteData.email.trim() || !inviteData.name.trim() || !inviteData.teamId) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // Generate password if not provided
    const password = inviteData.password.trim() || generatePassword();

    try {
      await AuthService.signup({
        username: inviteData.email.trim(),
        email: inviteData.email.trim(),
        name: inviteData.name.trim(),
        teamId: inviteData.teamId,
        password: password,
      });

      toast({
        title: 'User Invited! 🎉',
        description: `${inviteData.name} has been added to the platform.`,
      });

      // Show password to admin
      if (!inviteData.password.trim()) {
        toast({
          title: 'Generated Password',
          description: `Password for ${inviteData.email}: ${password}`,
          duration: 10000,
        });
      }

      setIsInviteDialogOpen(false);
      setInviteData({
        email: '',
        name: '',
        teamId: '',
        password: '',
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to invite user.',
        variant: 'destructive',
      });
    }
  };

  const deleteUser = (userId: string) => {
    const userToDelete = allUsers.find(u => u.id === userId);
    if (!userToDelete) return;

    if (confirm(`Are you sure you want to delete ${userToDelete.name}? This action cannot be undone.`)) {
      try {
        AuthService.deleteUser(userId);
        toast({
          title: 'User Deleted',
          description: `${userToDelete.name} has been removed from the platform.`,
        });
        loadData();
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to delete user.',
          variant: 'destructive',
        });
      }
    }
  };

  const associateData = (orphanedUserId: string, authUserId: string) => {
    const success = DataMigration.associateDataWithUser(orphanedUserId, authUserId);
    if (success) {
      toast({
        title: 'Data Associated! 🎉',
        description: 'Standup data has been linked to the user account.',
      });
      loadData();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to associate data.',
        variant: 'destructive',
      });
    }
  };

  const cleanupOrphanedData = () => {
    if (confirm('Are you sure you want to delete all orphaned data? This cannot be undone.')) {
      const removedCount = DataMigration.cleanupOrphanedData();
      toast({
        title: 'Cleanup Complete',
        description: `Removed ${removedCount} orphaned entries.`,
      });
      loadData();
    }
  };

  const autoAssociateData = () => {
    const associatedCount = DataMigration.autoAssociateObviousMatches();
    if (associatedCount > 0) {
      toast({
        title: 'Auto-Association Complete! 🎉',
        description: `Automatically linked ${associatedCount} data entries to matching users.`,
      });
      loadData();
    } else {
      toast({
        title: 'No Matches Found',
        description: 'No obvious matches found for auto-association.',
      });
    }
  };

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || 'Unknown Team';
  };

  const getTeamColor = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.color || '#gray';
  };

  // Check if current user is admin
  const isAdmin = user && (user.isAdmin || user.username === 'admin' || user.name.toLowerCase().includes('admin'));

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-red-400" />
            <h3 className="text-xl font-semibold mb-2 text-red-800">Access Denied</h3>
            <p className="text-red-600">
              You don't have admin privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users and platform settings
          </p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@company.com"
                />
                <p className="text-xs text-muted-foreground">
                  This will be their username for login
                </p>
              </div>

              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={inviteData.name}
                  onChange={(e) => setInviteData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label>Team *</Label>
                <Select value={inviteData.teamId} onValueChange={(value) => setInviteData(prev => ({ ...prev, teamId: value }))}>
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
                <Label>Password (optional)</Label>
                <Input
                  type="password"
                  value={inviteData.password}
                  onChange={(e) => setInviteData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Leave empty to auto-generate"
                />
                <p className="text-xs text-muted-foreground">
                  If empty, a secure password will be generated
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={inviteUser} className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsInviteDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{allUsers.length}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{teams.length}</div>
              <div className="text-sm text-muted-foreground">Teams</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {allUsers.filter(u => u.lastLoginAt &&
                  new Date(u.lastLoginAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
                ).length}
              </div>
              <div className="text-sm text-muted-foreground">Active This Week</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Platform Users ({allUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allUsers.map((platformUser) => (
              <div key={platformUser.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                    <span className="font-semibold text-gray-700">
                      {platformUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium">{platformUser.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{platformUser.email || platformUser.username}</span>
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `${getTeamColor(platformUser.teamId)}20`,
                          color: getTeamColor(platformUser.teamId),
                          borderColor: getTeamColor(platformUser.teamId)
                        }}
                      >
                        {getTeamName(platformUser.teamId)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {platformUser.lastLoginAt ? (
                    <Badge variant="outline" className="text-xs">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Last: {new Date(platformUser.lastLoginAt).toLocaleDateString()}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-gray-500">
                      <UserX className="h-3 w-3 mr-1" />
                      Never logged in
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteUser(platformUser.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Migration */}
      {(orphanedData.length > 0 || suggestedAssociations.length > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
              <Database className="h-5 w-5" />
              Data Migration ({orphanedData.length} orphaned entries)
            </CardTitle>
            <p className="text-sm text-orange-700">
              Found standup data that isn't associated with any user account. You can link this data to existing users or clean it up.
            </p>
            <div className="mt-3">
              <Button
                onClick={autoAssociateData}
                className="bg-orange-600 hover:bg-orange-700 mr-2"
              >
                <Link className="h-4 w-4 mr-2" />
                Auto-Link Obvious Matches
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {suggestedAssociations.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-orange-800">Suggested Associations:</h4>
                <div className="space-y-2">
                  {suggestedAssociations.map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded border border-orange-200">
                      <div className="flex items-center gap-3">
                        <span className="text-sm">
                          Data for <strong>"{suggestion.orphanedUserId}"</strong> → {suggestion.suggestedAuthUser.name}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => associateData(suggestion.orphanedUserId, suggestion.suggestedAuthUser.id)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Link className="h-4 w-4 mr-1" />
                        Link Data
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {orphanedData.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 text-orange-800">All Orphaned Data:</h4>
                <div className="space-y-2 mb-4">
                  {orphanedData.map((orphan, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded border border-orange-200">
                      <div>
                        <span className="text-sm font-medium">User ID: {orphan.userId}</span>
                        <div className="text-xs text-gray-600">
                          {orphan.entryCount} entries, latest: {orphan.latestEntry}
                        </div>
                      </div>
                      <Select onValueChange={(userId) => associateData(orphan.userId, userId)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Link to user..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allUsers.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email || user.username})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={cleanupOrphanedData}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clean Up All Orphaned Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Teams Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Teams Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map(team => {
              const teamUsers = allUsers.filter(u => u.teamId === team.id);
              return (
                <div key={team.id} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <h4 className="font-medium">{team.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {teamUsers.length} member{teamUsers.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-1">
                    {teamUsers.map(teamUser => (
                      <div key={teamUser.id} className="text-xs text-gray-600">
                        • {teamUser.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}