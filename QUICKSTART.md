# 🚀 Quick Start - Get cReate Running in 5 Minutes

## Step 1: Create Supabase Project (2 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"New Project"**
3. Sign in with GitHub (recommended) or email
4. Create a new organization (if needed)
5. Click **"New Project"**:
   - **Name**: `create-app` (or anything you like)
   - **Database Password**: Create a strong password (save it somewhere!)
   - **Region**: Choose closest to you
   - Click **"Create new project"**
6. Wait 2 minutes for database to set up ☕

## Step 2: Set Up Database (1 minute)

1. Once your project is ready, click **"SQL Editor"** in the left sidebar
2. Open the file `supabase-schema.sql` in your code editor
3. **Copy ALL the SQL code** (Ctrl+A, Ctrl+C)
4. Go back to Supabase SQL Editor
5. Click **"New query"**
6. **Paste** the SQL code
7. Click **"Run"** (or press Ctrl+Enter)
8. You should see "Success. No rows returned" ✅

## Step 3: Get Your Credentials (30 seconds)

1. In Supabase, click **⚙️ Settings** → **API**
2. You'll see two things you need:
   - **Project URL** (starts with `https://`)
   - **anon public** key (long string starting with `eyJ...`)
3. Keep this tab open!

## Step 4: Configure Your App (1 minute)

1. In your code editor, open `.env.local`
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Save the file** (Ctrl+S)

## Step 5: Restart Dev Server (30 seconds)

1. In your terminal, press **Ctrl+C** to stop the server
2. Run: `npm run dev`
3. Open **http://localhost:3001**

## ✅ Test It!

1. Click **"Sign Up"**
2. Enter any email and password (min 6 characters)
3. Click **"Sign Up"**
4. You should be redirected to the dashboard! 🎉

## 🎉 You're Done!

Now you can:
- Create projects
- Upload datasets
- Chat with the AI
- Generate R code
- View plots

---

## 🐛 Troubleshooting

### Still seeing "Failed to fetch"?
- Make sure you saved `.env.local`
- Restart the dev server (Ctrl+C, then `npm run dev`)
- Check that your Supabase URL and key are correct (no extra spaces!)

### Email confirmation required?
- Go to Supabase → Authentication → Providers
- Toggle off "Enable email confirmations" for testing
- Or check your email inbox for confirmation link

### Can't create projects?
- Make sure you ran the SQL schema in Supabase
- Check browser console for errors (F12)

---

Need help? Check [SETUP.md](./SETUP.md) for detailed instructions!

