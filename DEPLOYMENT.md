# BrickTrack Deployment Guide

## Quick Hosting Options for Testing

### Option 1: Netlify (Recommended - Free & Easy)

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com) and sign up/login
   - Drag and drop the `dist` folder to Netlify's deploy area
   - Your app will be live at a URL like `https://amazing-name-123456.netlify.app`

3. **Share with your friend:**
   - Send them the Netlify URL
   - They can create an account and test with you!

### Option 2: Vercel (Also Free & Easy)

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel:**
   - Install Vercel CLI: `npm i -g vercel`
   - Run: `vercel --prod`
   - Follow the prompts
   - Your app will be live at a vercel.app URL

### Option 3: GitHub Pages

1. **Push to GitHub:**
   - Create a new GitHub repository
   - Push your code to the repository

2. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Set source to "GitHub Actions"
   - Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: actions/deploy-pages@v1
        with:
          artifact_name: github-pages
          path: dist
```

## Testing with Multiple Users

### Admin Setup

1. **Create an admin account:**
   - Sign up with username: `admin`
   - Use any password you want
   - Choose any team

2. **Access admin dashboard:**
   - Navigate to `/admin` (will appear in navigation)
   - Invite users via email
   - Manage existing data

### Data Migration

If you see orphaned data (like the existing "adam" entries):

1. **Go to Admin Dashboard**
2. **Look for "Data Migration" section**
3. **Link orphaned data to your account:**
   - The system will suggest linking "adam" data to your "Adam" account
   - Click "Link Data" to associate it

### Inviting Your Friend

1. **Use the Admin Dashboard:**
   - Click "Invite User"
   - Enter their email (this becomes their username)
   - Choose their team
   - System will generate a password (or you can set one)

2. **Share credentials:**
   - Send them the app URL
   - Give them their email and password
   - They can log in and start using the app!

## Local Development for Testing

If you want to test locally with your friend:

### Option 1: ngrok (Easiest)

1. **Install ngrok:** [ngrok.com](https://ngrok.com)
2. **Start your dev server:** `npm run dev`
3. **Expose it:** `ngrok http 5173`
4. **Share the ngrok URL** with your friend

### Option 2: Local Network

1. **Start dev server on all interfaces:**
   ```bash
   npm run dev -- --host 0.0.0.0
   ```
2. **Find your IP address:**
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`
3. **Share your IP:** `http://YOUR_IP:5173`

## Data Persistence

**Important:** The app uses localStorage, so data is stored in each user's browser. For production use, you'd want to implement a backend database, but for testing this works perfectly!

## Features to Test

1. **Sprint Planning:** Create sprints and set goals
2. **Task Management:** Add tasks in "My Tasks"
3. **Team Standup:** See everyone's progress
4. **Data Sync:** Tasks added in "My Tasks" appear in standup
5. **Slack Export:** Generate team updates

## Troubleshooting

- **Can't see admin menu?** Make sure your username is "admin" or your name contains "admin"
- **Data not syncing?** Check the admin dashboard for orphaned data
- **Friend can't access?** Make sure you're using a public hosting option (not localhost)

## Next Steps for Production

For a real production deployment, consider:
- Backend database (PostgreSQL, MongoDB)
- Real authentication (Auth0, Firebase Auth)
- Email invitations
- Team management
- Data backup/export

But for testing and small teams, this setup works great! 🚀