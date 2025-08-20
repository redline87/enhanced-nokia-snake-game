# Database Setup for Persistent Scores

The Snake game now supports persistent storage that survives deployments. Here's how to set it up:

## Current Status
- **Local Development**: Uses SQLite (scores stored in `scores.db`)
- **Production**: Currently uses temporary SQLite (resets on deployment)
- **Solution**: Switch to PostgreSQL for persistent storage

## Option 1: Free Neon PostgreSQL Database (Recommended)

1. Go to [Neon](https://neon.com) and create a free account
2. Create a new database project
3. Copy the connection string (looks like: `postgresql://username:password@host/database`)
4. Add it to Vercel environment variables:
   ```bash
   vercel env add POSTGRES_URL
   # Paste your connection string when prompted
   ```
5. Redeploy: `vercel --prod`

## Option 2: Supabase (Alternative)

1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings → Database → Connection string
4. Copy the connection string and add to Vercel as above

## Option 3: Other Free PostgreSQL Providers

- **Railway**: Good for simple setups
- **Aiven**: Enterprise-grade with free tier
- **Render**: Easy setup with good documentation

## How It Works

The database utility automatically:
- Uses SQLite for local development (when no `POSTGRES_URL` is set)
- Switches to PostgreSQL in production (when `POSTGRES_URL` is available)
- Handles all the connection and query differences automatically

## Current Deployment

The game is live at: https://classic-nokia-snake-game-pc0u34mil-josef-bells-projects.vercel.app

**Note**: Until you set up PostgreSQL, scores will still reset with each deployment. Once you add the `POSTGRES_URL` environment variable, all scores will be permanently stored!