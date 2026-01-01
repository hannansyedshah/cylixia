import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'

// In-memory rate limiting store
// In production, consider using Redis or a database for distributed systems
interface RateLimitEntry {
  attempts: number
  lastAttempt: number
  blockedUntil?: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Configuration
const MAX_ATTEMPTS = 5 // Maximum failed attempts
const BLOCK_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds
const WINDOW_DURATION = 60 * 60 * 1000 // 1 hour window for rate limiting
const CLEANUP_INTERVAL = 60 * 60 * 1000 // Clean up old entries every hour

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.lastAttempt < now - WINDOW_DURATION && !entry.blockedUntil) {
      rateLimitStore.delete(key)
    }
  }
}, CLEANUP_INTERVAL)

function getClientIdentifier(request: NextRequest): string {
  // Use IP address for rate limiting
  // In production behind a proxy, use X-Forwarded-For header
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  // Try to get IP from various headers (for different proxy configurations)
  let ip = forwarded ? forwarded.split(',')[0].trim() : 
           realIp || 
           'unknown'
  
  // For localhost/development, use a combination of IP and User-Agent to differentiate users
  // This helps with testing but still provides protection
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'unknown' || !ip) {
    const userAgent = request.headers.get('user-agent') || 'unknown'
    // Create a simple hash-like identifier for localhost users
    ip = `localhost-${userAgent.substring(0, 20)}`
  }
  
  return ip
}

function hashSecret(secret: string): string {
  // Use SHA-256 for hashing the secret phrase
  // In production, consider using bcrypt for additional security
  return createHash('sha256').update(secret).digest('hex')
}

function verifySecret(input: string, expectedHash: string): boolean {
  const inputHash = hashSecret(input)
  
  // Use timing-safe comparison to prevent timing attacks
  if (inputHash.length !== expectedHash.length) {
    return false
  }
  
  try {
    return timingSafeEqual(
      Buffer.from(inputHash),
      Buffer.from(expectedHash)
    )
  } catch {
    return false
  }
}

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number; remainingAttempts?: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }

  // Check if currently blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) // seconds
    }
  }

  // Reset if window expired
  if (entry.lastAttempt < now - WINDOW_DURATION) {
    rateLimitStore.delete(identifier)
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }

  // Check if max attempts reached
  if (entry.attempts >= MAX_ATTEMPTS) {
    const blockedUntil = now + BLOCK_DURATION
    rateLimitStore.set(identifier, {
      ...entry,
      blockedUntil,
      lastAttempt: now
    })
    return {
      allowed: false,
      retryAfter: Math.ceil(BLOCK_DURATION / 1000)
    }
  }

  const remainingAttempts = MAX_ATTEMPTS - entry.attempts
  return { allowed: true, remainingAttempts }
}

function recordFailedAttempt(identifier: string): { attempts: number; remainingAttempts: number; blocked: boolean } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier) || {
    attempts: 0,
    lastAttempt: now
  }

  const newAttempts = entry.attempts + 1
  const remainingAttempts = MAX_ATTEMPTS - newAttempts
  let blocked = false

  // If max attempts reached, block the user
  if (newAttempts >= MAX_ATTEMPTS) {
    const blockedUntil = now + BLOCK_DURATION
    rateLimitStore.set(identifier, {
      attempts: newAttempts,
      lastAttempt: now,
      blockedUntil
    })
    blocked = true
  } else {
    rateLimitStore.set(identifier, {
      attempts: newAttempts,
      lastAttempt: now
    })
  }

  return { attempts: newAttempts, remainingAttempts, blocked }
}

function recordSuccess(identifier: string) {
  // Reset attempts on successful validation
  rateLimitStore.delete(identifier)
}

export async function POST(request: NextRequest) {
  try {
    const { inviteCode } = await request.json()

    if (!inviteCode || typeof inviteCode !== 'string') {
      return NextResponse.json(
        { error: 'Invite code is required', valid: false },
        { status: 400 }
      )
    }

    // Get client identifier for rate limiting
    const identifier = getClientIdentifier(request)

    // Check if already blocked
    const rateLimit = checkRateLimit(identifier)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Please try again in ${Math.ceil((rateLimit.retryAfter || 0) / 60)} minutes.`,
          valid: false,
          retryAfter: rateLimit.retryAfter,
          remainingAttempts: 0
        },
        { status: 429 } // Too Many Requests
      )
    }

    // Get expected hash from server-side environment variable
    const expectedHash = process.env.SIGNUP_CODE_HASH

    if (!expectedHash) {
      console.error('SIGNUP_CODE_HASH environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error', valid: false },
        { status: 500 }
      )
    }

    // Verify the invite code
    const isValid = verifySecret(inviteCode.trim(), expectedHash)

    if (isValid) {
      recordSuccess(identifier)
      return NextResponse.json({ valid: true, remainingAttempts: MAX_ATTEMPTS })
    } else {
      // Record failed attempt and get remaining attempts
      const attemptResult = recordFailedAttempt(identifier)

      if (attemptResult.blocked) {
        return NextResponse.json(
          {
            error: `Too many failed attempts. Please try again in ${Math.ceil(BLOCK_DURATION / 60000)} minutes.`,
            valid: false,
            remainingAttempts: 0,
            retryAfter: Math.ceil(BLOCK_DURATION / 1000)
          },
          { status: 429 }
        )
      }

      // Return error with remaining attempts
      const attemptsText = attemptResult.remainingAttempts === 1
        ? '1 attempt remaining'
        : `${attemptResult.remainingAttempts} attempts remaining`

      const errorMessage = `Invalid invite code. You have ${attemptsText}.`

      return NextResponse.json(
        {
          error: errorMessage,
          valid: false,
          remainingAttempts: attemptResult.remainingAttempts
        },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error validating invite code:', error)
    return NextResponse.json(
      { error: 'Internal server error', valid: false },
      { status: 500 }
    )
  }
}

