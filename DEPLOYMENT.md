# 🚀 Deployment Guide - Snake Game Live Service

## Production Deployment to Vercel

### Prerequisites
1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **PostgreSQL Database**: Set up a free database at one of:
   - [Supabase](https://supabase.com) (Recommended - Free tier)
   - [Neon](https://neon.tech) (Free tier)
   - [Railway](https://railway.app) (Free trial)

### Step 1: Database Setup

#### Option A: Supabase (Recommended)
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy the connection string (use "Transaction" mode)
5. Your URL will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

#### Option B: Neon
1. Sign up at [neon.tech](https://neon.tech)
2. Create new project
3. Copy the connection string from dashboard
4. Enable SSL mode in the connection string

### Step 2: Deploy to Vercel

#### Via GitHub (Recommended)
1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Configure environment variables (see below)
5. Click "Deploy"

#### Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts and set environment variables
```

### Step 3: Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

```env
POSTGRES_URL=your_database_connection_string
JWT_SECRET=generate_a_32_character_random_string
NODE_ENV=production
```

#### Generate JWT Secret
```bash
# Generate secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Verify Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Test registration/login
3. Play a game and check Battle Pass XP updates
4. Verify scores are saved to leaderboard

## 🔧 Local Development

### Setup
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your local settings
# For local dev, you can leave POSTGRES_URL empty (uses SQLite)

# Run development server
npm run dev
```

### Local Database
- Development uses SQLite automatically if no POSTGRES_URL
- Database file: `scores.db` (created automatically)
- No additional setup needed

## 📊 Production Features

### Working Features ✅
- User authentication (JWT)
- Battle Pass with 50 tiers
- XP progression system
- Score leaderboards
- User profiles
- PWA support (installable)
- Offline mode with service worker

### Frontend-Only Features ⚠️
- Clan system (UI only)
- Achievements (local storage)
- Daily challenges (randomly generated)
- Sound effects (not implemented)
- Social features (mockup)

### Not Implemented Yet ❌
- Payment processing
- Email verification
- Push notifications
- Real-time multiplayer
- Cloud saves sync

## 🔒 Security Considerations

### Required for Production
1. **HTTPS Only**: Vercel provides this automatically
2. **Strong JWT Secret**: Use 32+ character random string
3. **Database SSL**: Required for production PostgreSQL
4. **Rate Limiting**: Consider adding (not implemented yet)
5. **Input Validation**: Basic validation implemented

### Recommended Security Headers
Already configured in `vercel.json`:
- CORS headers for API
- Service Worker headers
- Content-Type headers

## 📈 Monitoring

### Vercel Analytics
- Enable in Vercel Dashboard → Analytics
- Free tier includes basic metrics
- Tracks page views, performance

### Database Monitoring
- Supabase: Built-in dashboard
- Neon: Monitoring in dashboard
- Railway: Metrics dashboard

### Error Tracking (Optional)
```javascript
// Add to index.html for error tracking
window.addEventListener('error', (event) => {
  // Send to your error tracking service
  console.error('Global error:', event.error);
});
```

## 🎮 Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test user login
- [ ] Play a game and verify XP updates
- [ ] Check Battle Pass progression
- [ ] Verify leaderboard updates
- [ ] Test PWA installation
- [ ] Check offline mode
- [ ] Test on mobile devices
- [ ] Verify HTTPS is working
- [ ] Check console for errors

## 🆘 Troubleshooting

### Database Connection Issues
- Verify POSTGRES_URL is correct
- Check SSL mode is enabled
- Ensure database is accessible
- Check connection pool settings

### Authentication Not Working
- Verify JWT_SECRET is set
- Check token expiration
- Clear browser localStorage
- Check CORS settings

### Battle Pass Not Updating
- Check database connection
- Verify user is authenticated
- Check browser console for errors
- Ensure backend APIs are accessible

### Service Worker Issues
- Clear browser cache
- Unregister old service workers
- Check HTTPS is enabled
- Verify manifest.json is served

## 📞 Support

For deployment issues:
1. Check Vercel deployment logs
2. Review browser console errors
3. Check database connection logs
4. Verify environment variables

## 🎉 Success Metrics

Once deployed, monitor:
- User registrations
- Daily active users
- Battle Pass engagement
- Average session duration
- Score submissions
- Error rates

## 📝 Next Steps

After successful deployment:
1. Set up payment processing (Stripe)
2. Add email verification
3. Implement clan backend
4. Add real-time features
5. Set up analytics tracking
6. Add monitoring/alerting

---

**Congratulations! Your Snake Game Live Service is ready for production! 🐍🎮**