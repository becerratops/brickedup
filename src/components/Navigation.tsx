import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { UserMenu } from '@/components/auth/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { Target, MessageSquare, Building2, CheckSquare, Shield, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const navItems = [
  {
    href: '/',
    label: 'Standup',
    icon: Building2,
    description: 'Sprint progress & team updates',
  },
  {
    href: '/my-tasks',
    label: 'My Tasks',
    icon: CheckSquare,
    description: 'Add, edit & complete your tasks',
  },
  {
    href: '/sprint-planning',
    label: 'Sprint Planning',
    icon: Target,
    description: 'Create & manage sprint goals',
  },
  {
    href: '/slack-export',
    label: 'Slack Export',
    icon: MessageSquare,
    description: 'Generate Slack updates',
  },
];

export function Navigation() {
  const location = useLocation();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  // Check if current user is admin
  const isAdmin = user && (user.isAdmin || user.username === 'admin' || user.name.toLowerCase().includes('admin'));

  return (
    <Card className="p-4 bg-card text-card-foreground">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
          <Building2 className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">BrickTrack</h1>
          <p className="text-sm text-muted-foreground">Team Accountability</p>
        </div>
        <div className="ml-auto">
          <button
            className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded border hover:bg-accent"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link key={item.href} to={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start h-auto p-3',
                  isActive && 'bg-primary text-primary-foreground'
                )}
              >
                <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className={cn(
                    'text-xs',
                    isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  )}>
                    {item.description}
                  </div>
                </div>
              </Button>
            </Link>
          );
        })}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="border-t pt-2 mt-4">
              <p className="text-xs text-muted-foreground px-3 mb-2">Admin</p>
              <Link to="/admin">
                <Button
                  variant={location.pathname === '/admin' ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start h-auto p-3',
                    location.pathname === '/admin' && 'bg-primary text-primary-foreground'
                  )}
                >
                  <Shield className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">Admin Dashboard</div>
                    <div className={cn(
                      'text-xs',
                      location.pathname === '/admin' ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    )}>
                      Manage users & platform
                    </div>
                  </div>
                </Button>
              </Link>
            </div>
          </>
        )}
      </nav>

      <div className="mt-6 pt-4 border-t space-y-4">
        <UserMenu />
        <p className="text-xs text-muted-foreground text-center">
          vibed by{' '}
          <a
            href="https://github.com/ariondir"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            ariondir
          </a>
        </p>
      </div>
    </Card>
  );
}