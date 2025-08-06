# The Current - Deployment Instructions

## Quick Setup Guide (24-48 Hours to Launch)

### Step 1: Environment Setup

1. **Clone your repository** from Lovable to VS Code
2. **Install new dependencies**:
   ```bash
   npm install openai rss-parser
   npm install --save-dev @types/rss-parser
   ```

3. **Create environment file**:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your actual values:
     ```bash
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     OPENAI_API_KEY=your_openai_api_key
     ```

### Step 2: Get API Keys

1. **OpenAI API Key**:
   - Go to https://platform.openai.com/api-keys
   - Create new secret key
   - Add to `.env.local` as `OPENAI_API_KEY`

2. **Supabase Service Role Key**:
   - Go to your Supabase project settings
   - API section → Service Role key
   - Add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: File Structure

Create these files in your project:

```
your-project/
├── lib/
│   └── content-pipeline.ts
├── app/
│   ├── api/
│   │   └── admin/
│   │       ├── refresh-content/route.ts
│   │       ├── moderate-article/route.ts
│   │       ├── moderate-comment/route.ts
│   │       ├── handle-report/route.ts
│   │       ├── ban-user/route.ts
│   │       ├── dashboard-stats/route.ts
│   │       └── seed-content/route.ts
│   └── admin/
│       ├── page.tsx
│       └── setup/
│           └── page.tsx
├── components/
│   └── AdminDashboard.tsx
├── .env.local
└── .env.local.example
```

### Step 4: Initial Content Setup

1. **Run locally first**:
   ```bash
   npm run dev
   ```

2. **Visit setup page**:
   - Go to `http://localhost:3000/admin/setup`
   - Click "Start Setup" 
   - This will populate your database with initial articles

3. **Test admin dashboard**:
   - Go to `http://localhost:3000/admin`
   - Verify you can see articles and stats

### Step 5: Deploy to Netlify

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add content pipeline and admin dashboard"
   git push origin main
   ```

2. **Deploy on Netlify**:
   - Connect your GitHub repo to Netlify
   - Add environment variables in Netlify dashboard:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `OPENAI_API_KEY`

3. **Test production deployment**:
   - Visit your deployed site
   - Go to `/admin/setup` and run setup
   - Verify `/admin` dashboard works

### Step 6: Soft Launch Ready!

Your app is now ready with:
- ✅ Automated content pipeline
- ✅ Admin moderation tools
- ✅ User authentication
- ✅ Real-time features
- ✅ Mobile-responsive design

## Post-Launch Tasks

### Week 1:
- Monitor content quality in `/admin`
- Manually refresh content as needed
- Watch user engagement metrics

### Week 2+:
- Set up automated content refresh (optional)
- Add more RSS sources to pipeline
- Implement push notifications
- Plan mobile app development

## Troubleshooting

### Common Issues:

1. **"Module not found" errors**:
   ```bash
   npm install
   ```

2. **OpenAI API errors**:
   - Check your API key is valid
   - Ensure you have credits in your OpenAI account

3. **Supabase connection issues**:
   - Verify your service role key
   - Check RLS policies are active

4. **No articles appearing**:
   - Run `/admin/setup` first
   - Check console for RSS feed errors
   - Verify your content pipeline is working

### Support:
- Check Supabase dashboard for database issues
- Monitor Netlify function logs for API errors
- Use browser dev tools to debug frontend issues

## Content Management

### Daily Tasks:
- Check `/admin` for new articles
- Moderate any reported comments
- Review user engagement stats

### Weekly Tasks:
- Manually refresh content via admin panel
- Review and update RSS sources
- Monitor content quality and relevance

Your AI news platform is now live and ready to serve your community! 🚀