/**
 * UTF-8 Safe Base64 Encoding/Decoding
 * 
 * The native btoa() function only works with Latin1 characters.
 * These functions properly handle Unicode/UTF-8 strings.
 */

/**
 * Encode a string to base64, handling Unicode characters properly
 */
export function encodeBase64(str: string): string {
  // Convert string to UTF-8 bytes
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str)
  
  // Convert bytes to base64
  // Use a method that works in both browser and Node
  if (typeof Buffer !== 'undefined') {
    // Node.js environment
    return Buffer.from(bytes).toString('base64')
  } else {
    // Browser environment
    // Convert Uint8Array to binary string
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
}

/**
 * Decode a base64 string to UTF-8 string
 */
export function decodeBase64(base64: string): string {
  if (typeof Buffer !== 'undefined') {
    // Node.js environment
    const buffer = Buffer.from(base64, 'base64')
    const decoder = new TextDecoder()
    return decoder.decode(buffer)
  } else {
    // Browser environment
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const decoder = new TextDecoder()
    return decoder.decode(bytes)
  }
}

/**
 * Convert an ArrayBuffer to base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  } else {
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
}

