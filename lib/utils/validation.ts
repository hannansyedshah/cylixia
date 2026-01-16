/**
 * Validates an email address using a regex pattern.
 * Checks for basic email format: local@domain.tld
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
