# Remembrall

A minimal internal web app for startup teams to log daily standup updates and track accountability.

## Features

🔐 **Team-Based User Management**: Organize users by teams (Development, Marketing) with dropdown selection or free text input
📋 **Smart Task Management**: Individual task entries with bullet-point auto-parsing and completion tracking
🎯 **Editable Sprint Goals**: All users can edit sprint goals in real-time for collaborative planning
👤 **Personal Task View**: Dedicated "My Tasks" view for individual task management and end-of-day workflows
👥 **Team Standup View**: Real-time view of what everyone is working on with user tagging and collaboration
🚀 **End-of-Day Workflow**: Guided process to update progress and plan tomorrow before leaving work
📅 **Enhanced Dashboard**: View tasks by completion status, team, and sprint alignment with delay tracking
📤 **Professional Slack Export**: Clean formatted output with date subtitles and organized task lists
🔄 **Incomplete Task Management**: Smart handling of incomplete tasks with move/complete options and reasoning
⏰ **Stress-Free Planning**: Plan tomorrow's work today for peace of mind and focused mornings

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

## Deployment Options

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Deploy automatically on every push to main

### Netlify
1. Connect your GitHub repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`

### Local/Self-hosted
1. Run `npm run build`
2. Serve the `dist/` directory with any static file server

## Usage

### Daily Standup Entry
1. **Select your team** (Development or Marketing)
2. **Select your name** from the dropdown or add a new team member
3. **Handle incomplete tasks** from previous days (mark complete or move to today with reasoning)
4. **Add yesterday's tasks** (if not first time) and mark completion status
5. **Add today's tasks** with smart bullet-point parsing
6. **Tag team members** on tasks for collaboration and help
7. **Add blockers** or help needed (paragraph format)
8. **View sprint context** with goals and task breakdown

### My Tasks View
- **Personal task management** with focus on individual productivity
- **End-of-day workflow** with completion tracking and tomorrow's planning
- **Sprint context** visible while working on tasks
- **Progress tracking** with visual completion metrics
- **Smart reminders** for end-of-day updates (after 4 PM)

### Team Standup View
- **Real-time team overview** showing what everyone is working on
- **Sprint context** with current goals and task breakdown
- **User tagging** to see when you're mentioned in others' tasks
- **Team statistics** and completion metrics
- **Filter by team and date** for historical views

### Dashboard
- View all team entries by date with individual task breakdowns
- Filter by team member, date, or delayed tasks only
- See highlighted incomplete tasks after 2+ days
- Track delay counts for individual tasks
- Team color coding for easy identification

### Slack Export
1. Select the date you want to export
2. Copy the professionally formatted text with date subtitles
3. Paste directly into your Slack standup channel

**Example Output:**
```
📅 **Daily Standup - Mon, Aug 7**

@Adam
✅ **Completed Aug 6:**
   • Fixed authentication bug
   • Updated user dashboard
🔄 **Working on today:**
   • Implement new API endpoint
   • Review PR from Adam
⛔ **Blockers:** Waiting on database migration approval
```

### Sprint Management
1. **Create comprehensive sprints** with goals, backlog items, and task breakdown
2. **Set capacity planning** and risk management
3. **Track task alignment** with sprint objectives
4. **View sprint context** during daily entries
5. **Monitor progress** across team dashboard

### Smart Task Features
- **Bullet-point auto-parsing**: Paste bulleted lists to create multiple tasks instantly
- **User tagging**: Tag team members on tasks for collaboration
- **Completion notes**: Add notes when marking tasks complete
- **Incomplete task flow**: Smart handling of tasks that carry over between days
- **Sprint alignment**: See which tasks align with current sprint goals
- **Editable sprint goals**: All users can collaboratively edit sprint goals in real-time

### End-of-Day Workflow
- **Automatic detection**: Shows reminders after 4 PM
- **Progress review**: Update completion status for all tasks
- **Tomorrow planning**: Set up next day's work before leaving
- **Peace of mind**: Know exactly what you're working on tomorrow
- **Stress reduction**: No morning scrambling or after-hours planning

## Data Storage

Currently uses browser localStorage for data persistence. All data stays on the user's device.

### Future Migration to Supabase
The codebase is structured to easily migrate to Supabase for team data sharing:
1. Replace `BrickTrackStorage` class with Supabase client calls
2. Add authentication for team access
3. Update data types to include team/workspace IDs

## Technology Stack

- **React 18.x** - Modern React with hooks
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Accessible component library
- **Vite** - Fast build tool and dev server
- **Lucide React** - Beautiful icons

## Project Structure

```
src/
├── components/          # UI components
│   ├── ui/             # shadcn/ui components
│   ├── DailyEntryForm.tsx
│   ├── Dashboard.tsx
│   ├── SlackExport.tsx
│   └── Navigation.tsx
├── pages/              # Page components
├── types/              # TypeScript type definitions
├── lib/                # Utility functions and storage
└── hooks/              # Custom React hooks
```

## Future Extensions

The codebase is structured to easily add:
- User role definitions with recurring responsibilities
- GPT-suggested tasks based on role + calendar
- Google Calendar integration
- Voice input via browser mic or Whisper
- Gemini transcript import (Google Meet → task auto-create)
- Team workspaces and authentication
- Real-time collaboration

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT

---

*Vibed with [MKStack](https://soapbox.pub/mkstack)*
