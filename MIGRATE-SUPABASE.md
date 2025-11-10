# Migrating to a New Supabase Account

This guide will help you migrate all your Supabase setup to a new account to reset usage limits.

## What Needs to Be Migrated

1. **Database Schema** (tables, functions, policies, triggers)
2. **Row Level Security (RLS) Policies**
3. **Database Functions**
4. **Realtime Configuration**
5. **Storage Buckets** (if you have any)
6. **Data** (optional - if you want to keep existing data)

## Step-by-Step Migration

### Step 1: Create New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new account (or use a different email)
3. Create a new project
4. Wait for it to be provisioned (2-3 minutes)

### Step 2: Export Database Schema from Old Project

1. In your **old** Supabase project, go to **SQL Editor**
2. Run this query to get all your table schemas:

```sql
-- Get all table creation statements
SELECT 
  'CREATE TABLE IF NOT EXISTS ' || tablename || ' (' || 
  string_agg(column_name || ' ' || data_type || 
    CASE 
      WHEN character_maximum_length IS NOT NULL 
      THEN '(' || character_maximum_length || ')'
      ELSE ''
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
    ', '
  ) || ');' as create_statement
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY tablename;
```

3. Or simply run all your SQL files in order (see below)

### Step 3: Generate Combined SQL File (Easiest Method)

Run this command to generate a single SQL file with everything:

```bash
pnpm run migrate:generate
```

This will create `supabase-complete-migration.sql` with all your schema.

### Step 3 Alternative: Run SQL Files Manually

If you prefer to run files individually, in your **new** Supabase project's SQL Editor, run these files **in order**:

1. **`supabase-schema.sql`** - Base tables and functions
2. **`supabase-collaboration-schema.sql`** - Collaboration features
3. **`supabase-shared-datasets-schema.sql`** - Shared datasets
4. **`supabase-enable-realtime.sql`** - Enable Realtime
5. **`supabase-complete-setup.sql`** - Verify and grant permissions

**OR** just run the generated `supabase-complete-migration.sql` file (recommended).

### Step 4: Update Environment Variables

Update your `.env.local` file with the new project's credentials:

```env
# New Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key

# Optional: If you need service role for admin operations
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key
```

### Step 5: (Optional) Migrate Data

If you want to keep existing data:

1. **Export data from old project:**
   - Go to **Database** > **Tables** in old project
   - For each table, click **Export** or use pg_dump

2. **Import data to new project:**
   - Use Supabase Dashboard's **SQL Editor** to insert data
   - Or use the **Database** > **Import** feature

### Step 6: Update Your Application

1. Update `.env.local` with new credentials
2. Restart your development server
3. Test that everything works

## Quick Migration (Recommended)

1. **Generate the combined SQL file:**
   ```bash
   pnpm run migrate:generate
   ```

2. **Open your new Supabase project** → **SQL Editor**

3. **Copy and paste** the entire contents of `supabase-complete-migration.sql`

4. **Click "Run"** - this will set up everything at once

5. **Update your `.env.local`** with new credentials

6. **Restart your app** - you're done!

## Important Notes

- **Auth Users**: User accounts won't automatically migrate. Users will need to sign up again in the new project.
- **Storage**: If you have storage buckets, you'll need to recreate them and re-upload files.
- **API Keys**: All API keys will be different - make sure to update your environment variables.
- **Realtime**: Make sure to enable Realtime for the `projects` table in the new project.

## Automated Migration (Advanced)

For a more automated approach, you can use Supabase CLI or pg_dump/pg_restore.

