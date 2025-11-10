/**
 * Helper function to remove ALTER PUBLICATION commands from SQL content
 * This handles DO $$ blocks properly by matching the entire block
 */

function removeAlterPublication(sqlContent) {
  // First, find and remove DO $$ blocks that contain ALTER PUBLICATION
  // We need to match the entire DO block from DO $$ to the matching $$;
  
  let result = sqlContent;
  let lastIndex = 0;
  let output = '';
  
  // Find all DO $$ blocks
  const doBlockRegex = /DO\s+\$\$/gi;
  let match;
  
  while ((match = doBlockRegex.exec(sqlContent)) !== null) {
    // Add text before this DO block
    output += sqlContent.substring(lastIndex, match.index);
    
    // Find the matching $$; for this DO block
    let blockStart = match.index;
    let blockEnd = blockStart;
    let depth = 0;
    let inBlock = true;
    let i = match.index + match[0].length;
    
    while (i < sqlContent.length && inBlock) {
      const char = sqlContent[i];
      const nextTwo = sqlContent.substring(i, i + 2);
      const nextThree = sqlContent.substring(i, i + 3);
      
      if (nextThree === '$$;') {
        // Found the end of the DO block
        blockEnd = i + 3;
        inBlock = false;
      } else if (nextTwo === '$$') {
        // Nested DO block - skip it
        depth++;
        i += 2;
      } else {
        i++;
      }
    }
    
    if (blockEnd > blockStart) {
      // Extract the DO block
      const doBlock = sqlContent.substring(blockStart, blockEnd);
      
      // Check if it contains ALTER PUBLICATION
      if (/ALTER\s+PUBLICATION/i.test(doBlock)) {
        output += '-- ALTER PUBLICATION command removed (requires owner privileges - enable via Dashboard)';
      } else {
        output += doBlock;
      }
      
      lastIndex = blockEnd;
    } else {
      // Couldn't find matching $$;, keep the original
      output += match[0];
      lastIndex = match.index + match[0].length;
    }
  }
  
  // Add remaining text
  output += sqlContent.substring(lastIndex);
  result = output;
  
  // Remove standalone ALTER PUBLICATION commands (not in DO blocks)
  result = result.replace(/^\s*ALTER\s+PUBLICATION\s+supabase_realtime[^;]*;/gim, '-- ALTER PUBLICATION command removed (requires owner privileges - enable via Dashboard)');
  result = result.replace(/^\s*ALTER\s+PUBLICATION[^;]*;/gim, '-- ALTER PUBLICATION command removed (requires owner privileges - enable via Dashboard)');
  
  return result;
}

module.exports = { removeAlterPublication };

