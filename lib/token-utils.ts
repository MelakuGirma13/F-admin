import { createHash, randomBytes } from "crypto"

// Generate a secure random token
export function generateToken(): string {
  return randomBytes(32).toString("hex")
}

// Hash a token for storage (don't store raw tokens in the database)
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

// Create an expiry date for the token (default: 1 hour from now)
export function createTokenExpiry(hours = 1): Date {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + hours)
  return expiry
}
