# cReate - Supabase Setup Guide

## 🚀 Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Fill in your project details
4. Wait for the database to be provisioned (2-3 minutes)

### 2. Set Up the Database

1. In your Supabase dashboard, go to the **SQL Editor**
2. Copy the entire contents of `supabase-schema.sql`
3. Paste it into a new query and click "Run"
4. This will create:
   - `projects` table
   - `messages` table
   - Row Level Security (RLS) policies
   - Necessary indexes

### 3. Configure Environment Variables

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

3. Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API (for custom Python backend - optional)
BACKEND_API_URL=http://localhost:8000

# Set to 'false' to use real Supabase auth
NEXT_PUBLIC_USE_MOCK_AUTH=false

# Signup Invite Code (Server-side only - DO NOT use NEXT_PUBLIC_ prefix)
# Generate the hash using: node scripts/generate-signup-hash.js "your-secret-phrase"
SIGNUP_CODE_HASH=your-generated-hash-here
```

### 4. Set Up Secure Signup Invite Code

1. Choose a strong secret phrase for signup (e.g., "my-secure-invite-code-2024")
2. Generate the hash for your secret phrase:
   ```bash
   node scripts/generate-signup-hash.js "your-secret-phrase"
   ```
3. Copy the generated hash and add it to your `.env.local` file as `SIGNUP_CODE_HASH`
4. **Important**: Never commit your secret phrase or the hash to version control
5. Users will need to enter your secret phrase to sign up

### 5. Enable Email Auth

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. (Optional) Configure email templates under **Authentication** → **Email Templates**

### 6. Run the Application

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

## ✅ Testing

1. **Sign Up**: Create a new account with any email/password
2. **Dashboard**: You should see an empty dashboard
3. **Create Project**: Click "New Project" and create one
4. **Test Isolation**: 
   - Sign out
   - Create another account
   - Verify you see a different empty dashboard (no projects from first account)

## 🔒 Security Features

- **Row Level Security (RLS)**: Users can only see/edit their own projects
- **Server-side validation**: All API routes verify user authentication
- **Secure by default**: Supabase handles password hashing, tokens, etc.
- **Brute-force protection**: Signup invite code validation includes:
  - Rate limiting (max 5 attempts per hour per IP)
  - 15-minute block after max attempts
  - Timing-safe comparison to prevent timing attacks
  - Server-side hashing (secret phrase never exposed to client)

## 📊 Database Schema

### projects
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `name` (TEXT)
- `description` (TEXT)
- `code` (TEXT)
- `plot_url` (TEXT)
- `dataset` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### messages
- `id` (UUID, Primary Key)
- `project_id` (UUID, Foreign Key to projects)
- `role` (TEXT: 'user' or 'assistant')
- `content` (TEXT)
- `code` (TEXT, nullable)
- `plot_url` (TEXT, nullable)
- `created_at` (TIMESTAMP)

## 🐛 Troubleshooting

### "Unauthorized" errors
- Check that your Supabase credentials are correct in `.env.local`
- Restart the dev server after changing `.env.local`
- Make sure you're logged in

### "Failed to fetch" errors
- Verify Supabase is accessible (check status.supabase.com)
- Check browser console for CORS errors
- Ensure RLS policies are set up correctly

### Projects not showing
- Check the browser console for errors
- Verify the SQL schema was run successfully
- Try signing out and back in

### R Code Execution Errors
- **Error**: "Hugging Face R API returned 404" - Space not found or endpoint incorrect
  - Check if the Space URL is correct
  - Verify the Space is publicly accessible
- **Error**: "Hugging Face R API returned 503" - Space is sleeping or starting up
  - Wait a moment and try again
  - The Space may need to be woken up

## 📝 Next Steps

- Set up R execution backend
- Configure custom email templates in Supabase
- Add social auth providers (Google, GitHub, etc.)
- Deploy to Vercel or another hosting platform

