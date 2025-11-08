#!/usr/bin/env node

/**
 * Utility script to generate a hash for the signup invite code
 * 
 * Usage:
 *   node scripts/generate-signup-hash.js "your-secret-phrase"
 * 
 * This will output a hash that you should set as SIGNUP_CODE_HASH in your .env.local file
 */

const { createHash } = require('crypto')
const readline = require('readline')

function hashSecret(secret) {
  return createHash('sha256').update(secret).digest('hex')
}

function main() {
  const args = process.argv.slice(2)
  
  if (args.length > 0) {
    // Secret phrase provided as command line argument
    const secret = args.join(' ')
    const hash = hashSecret(secret)
    console.log('\n✅ Generated hash for your secret phrase:')
    console.log(hash)
    console.log('\n📝 Add this to your .env.local file:')
    console.log(`SIGNUP_CODE_HASH=${hash}\n`)
  } else {
    // Interactive mode
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question('Enter your secret phrase: ', (secret) => {
      if (!secret.trim()) {
        console.error('❌ Secret phrase cannot be empty')
        rl.close()
        process.exit(1)
      }

      const hash = hashSecret(secret.trim())
      console.log('\n✅ Generated hash for your secret phrase:')
      console.log(hash)
      console.log('\n📝 Add this to your .env.local file:')
      console.log(`SIGNUP_CODE_HASH=${hash}\n`)
      console.log('⚠️  Keep your secret phrase secure and never commit it to version control!')
      
      rl.close()
    })
  }
}

main()

