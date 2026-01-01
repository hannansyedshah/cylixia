export function encodeBase64(str: string): string {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str)
  
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

export function decodeBase64(base64: string): string {
  if (typeof Buffer !== 'undefined') {
    const buffer = Buffer.from(base64, 'base64')
    const decoder = new TextDecoder()
    return decoder.decode(buffer)
  } else {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const decoder = new TextDecoder()
    return decoder.decode(bytes)
  }
}

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

