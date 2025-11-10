/**
 * Supabase Migration Helper
 * 
 * This script helps you migrate your Supabase setup to a new account.
 * It generates a single SQL file with all your schema that you can run in the new project.
 */

const fs = require('fs');
const path = require('path');
const { removeAlterPublication } = require('./remove-alter-publication');

// List of SQL files to combine (in order)
const sqlFiles = [
  'supabase-schema.sql',
  'supabase-collaboration-schema.sql',
  'supabase-shared-datasets-schema.sql',
  'supabase-enable-realtime.sql',
  'supabase-complete-setup.sql'
];

// Additional files to include if they exist
const optionalFiles = [
  'supabase-add-code-selection.sql',
  'supabase-add-messages-user-id.sql',
  'supabase-add-user-tracking.sql',
  'supabase-setup-storage.sql'
];

function combineSQLFiles(skipRealtime = false) {
  const projectRoot = path.join(__dirname, '..');
  const fileType = skipRealtime ? 'SAFE SUPABASE MIGRATION FILE (No Owner-Only Commands)' : 'COMPLETE SUPABASE MIGRATION FILE';
  const warning = skipRealtime ? `
-- ⚠️  WARNING: This file excludes ALTER PUBLICATION commands that require owner privileges.
-- After running this file, you MUST enable Realtime manually:
-- 1. Go to Supabase Dashboard > Database > Replication
-- 2. Enable Realtime for: projects, project_chat_messages, project_collaborators, shared_datasets
-- ============================================================================
` : '';
  
  let combinedSQL = `-- ============================================================================
-- ${fileType}
-- ============================================================================
-- This file contains all the SQL needed to set up your Supabase database
-- Run this entire file in your new Supabase project's SQL Editor
-- ============================================================================
-- Generated: ${new Date().toISOString()}
${warning}
`;

  // Add required files
  for (const file of sqlFiles) {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      let fileContent = fs.readFileSync(filePath, 'utf8');
      
      // If skipRealtime is true, remove ALL ALTER PUBLICATION commands from all files
      if (skipRealtime) {
        fileContent = removeAlterPublication(fileContent);
      }
      
      combinedSQL += `\n-- ============================================================================\n`;
      combinedSQL += `-- File: ${file}\n`;
      combinedSQL += `-- ============================================================================\n\n`;
      combinedSQL += fileContent;
      combinedSQL += `\n\n`;
    } else {
      console.warn(`Warning: ${file} not found, skipping...`);
    }
  }

  // Add optional files
  for (const file of optionalFiles) {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      combinedSQL += `\n-- ============================================================================\n`;
      combinedSQL += `-- Optional File: ${file}\n`;
      combinedSQL += `-- ============================================================================\n\n`;
      combinedSQL += fs.readFileSync(filePath, 'utf8');
      combinedSQL += `\n\n`;
    }
  }

  combinedSQL += `\n-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Update your .env.local with new Supabase credentials
-- 2. Enable Realtime for 'projects' table in Database > Replication
-- 3. Test your application
-- ============================================================================
`;

  // Write combined file
  const outputFileName = skipRealtime ? 'supabase-migration-safe.sql' : 'supabase-complete-migration.sql';
  const outputPath = path.join(projectRoot, outputFileName);
  fs.writeFileSync(outputPath, combinedSQL, 'utf8');
  
  console.log(`✅ Combined SQL file created: ${outputPath}`);
  console.log(`📝 File size: ${(combinedSQL.length / 1024).toFixed(2)} KB`);
  if (skipRealtime) {
    console.log(`\n⚠️  IMPORTANT: This file excludes ALTER PUBLICATION commands.`);
    console.log(`   After running this SQL, enable Realtime via Dashboard:`);
    console.log(`   Database > Replication > Enable for: projects, project_chat_messages, etc.`);
  }
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Open your new Supabase project`);
  console.log(`   2. Go to SQL Editor`);
  console.log(`   3. Copy and paste the contents of: ${outputPath}`);
  console.log(`   4. Click "Run"`);
  if (skipRealtime) {
    console.log(`   5. Enable Realtime via Dashboard (Database > Replication)`);
    console.log(`   6. Update your .env.local with new credentials`);
  } else {
    console.log(`   5. Update your .env.local with new credentials`);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const skipRealtime = args.includes('--skip-realtime') || args.includes('--safe');

// Run if called directly
if (require.main === module) {
  combineSQLFiles(skipRealtime);
}

module.exports = { combineSQLFiles };

