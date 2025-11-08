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
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown'
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

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry) {
    rateLimitStore.set(identifier, {
      attempts: 0,
      lastAttempt: now
    })
    return { allowed: true }
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
    rateLimitStore.set(identifier, {
      attempts: 0,
      lastAttempt: now
    })
    return { allowed: true }
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

  return { allowed: true }
}

function recordFailedAttempt(identifier: string) {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier) || {
    attempts: 0,
    lastAttempt: now
  }

  rateLimitStore.set(identifier, {
    ...entry,
    attempts: entry.attempts + 1,
    lastAttempt: now
  })
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

    // Check rate limit
    const rateLimit = checkRateLimit(identifier)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Please try again in ${Math.ceil((rateLimit.retryAfter || 0) / 60)} minutes.`,
          valid: false,
          retryAfter: rateLimit.retryAfter
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
      return NextResponse.json({ valid: true })
    } else {
      recordFailedAttempt(identifier)
      // Don't reveal whether the code was close or not
      return NextResponse.json(
        { error: 'Invalid invite code', valid: false },
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

