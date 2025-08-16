import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { BrickTrackStorage, getToday, formatDisplayDate } from '@/lib/storage';
import type { StandupEntry, User, SlackExportData } from '@/types/bricktrack';
import { Copy, Download } from 'lucide-react';

export function SlackExport() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<StandupEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getToday());
  const [exportText, setExportText] = useState<string>('');

  useEffect(() => {
    setEntries(BrickTrackStorage.getEntries());
    setUsers(BrickTrackStorage.getUsers());
  }, []);

  // Get unique dates for date selection
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(entries.map(entry => entry.date)))
      .sort((a, b) => b.localeCompare(a));
    return dates;
  }, [entries]);

  // Generate Slack export data
  const slackData = useMemo(() => {
    const dateEntries = entries.filter(entry => entry.date === selectedDate);
    const exportData: SlackExportData[] = [];

    dateEntries.forEach(entry => {
      const user = users.find(u => u.id === entry.userId);
      if (!user) return;

      const data: SlackExportData = {
        userId: entry.userId,
        userName: user.name,
        done: entry.yesterdayTasks?.filter(task => task.completed).map(task => task.text) || [],
        today: entry.todayTasks?.map(task => task.text) || [],
      };

      // Add blockers if they exist
      if (entry.blockers) {
        data.blockers = entry.blockers;
      }

      exportData.push(data);
    });

    return exportData.sort((a, b) => a.userName.localeCompare(b.userName));
  }, [entries, users, selectedDate]);

  // Generate formatted Slack text
  useEffect(() => {
    if (slackData.length === 0) {
      setExportText('No entries found for the selected date.');
      return;
    }

    // Calculate yesterday's date for the subtitle
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const yesterdayObj = new Date(selectedDateObj);
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayFormatted = formatDisplayDate(yesterdayObj.toISOString().split('T')[0]);

    const formattedText = slackData.map(data => {
      const lines = [`@${data.userName}`];

      if (data.done.length > 0) {
        lines.push(`✅ **Completed ${yesterdayFormatted}:**`);
        data.done.forEach(task => {
          lines.push(`   • ${task}`);
        });
      }

      if (data.today.length > 0) {
        lines.push(`🔄 **Working on today:**`);
        data.today.forEach(task => {
          lines.push(`   • ${task}`);
        });
      }

      if (data.blockers) {
        lines.push(`⛔ **Blockers:** ${data.blockers}`);
      }

      return lines.join('\n');
    }).join('\n\n');

    const header = `📅 **Daily Standup - ${formatDisplayDate(selectedDate)}**\n\n`;
    setExportText(header + formattedText);
  }, [slackData, selectedDate]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      toast({
        title: 'Copied!',
        description: 'Slack export text copied to clipboard.',
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard. Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `standup-${selectedDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded!',
      description: 'Slack export saved as text file.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Slack Export</h1>
        <p className="text-muted-foreground">
          Generate formatted standup updates for Slack
        </p>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="space-y-2 flex-1 max-w-xs">
              <Label>Date</Label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map(date => (
                    <SelectItem key={date} value={date}>
                      {formatDisplayDate(date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCopyToClipboard}
                disabled={!exportText || exportText.includes('No entries found')}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy to Clipboard
              </Button>

              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={!exportText || exportText.includes('No entries found')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
          <p className="text-sm text-muted-foreground">
            This text is ready to paste into Slack
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={exportText}
            readOnly
            rows={Math.min(20, exportText.split('\n').length + 2)}
            className="font-mono text-sm"
            placeholder="Select a date with entries to generate export text..."
          />
        </CardContent>
      </Card>

      {/* Summary */}
      {slackData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{slackData.length}</div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {slackData.reduce((total, d) => total + d.done.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Completed Tasks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {slackData.filter(d => d.blockers).length}
                </div>
                <div className="text-sm text-muted-foreground">With Blockers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {slackData.reduce((total, d) => total + d.today.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Today's Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}