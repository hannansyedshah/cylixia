# Manual Realtime Setup (Required)

The `ALTER PUBLICATION` command requires owner/superuser privileges that are not available through the SQL Editor.

## Why This Happens

- `ALTER PUBLICATION supabase_realtime` requires PostgreSQL superuser privileges
- Supabase restricts these privileges for security reasons
- The SQL Editor runs as a regular user, not the postgres superuser

## Solution: Enable Realtime via Dashboard

You **must** enable Realtime through the Supabase Dashboard (not SQL):

### Steps:

1. **Go to your Supabase Dashboard**
2. **Navigate to:** Database → Replication
3. **Enable Realtime for these tables:**
   - ✅ **projects** (required for real-time code sync)
   - ✅ **project_chat_messages** (required for collaboration chat)
   - ✅ **project_collaborators** (optional, for real-time updates)
   - ✅ **shared_datasets** (optional, for real-time dataset updates)

### How to Enable:

1. In the Replication page, you'll see a list of all tables
2. Find each table mentioned above
3. Toggle the switch/checkbox next to each table to enable Realtime
4. The changes take effect immediately

## Alternative: Skip the ALTER PUBLICATION Commands

If you want to run the SQL without errors, you can:

1. Comment out or remove all `ALTER PUBLICATION` commands from the SQL files
2. Run the SQL migration
3. Then manually enable Realtime through the Dashboard (as described above)

The SQL migration will work fine without the ALTER PUBLICATION commands - you just need to enable Realtime manually afterward.

