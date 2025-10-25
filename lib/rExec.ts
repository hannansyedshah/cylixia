/**
 * R Code Execution Utility
 * Handles communication with the Hugging Face R execution service
 */

export interface RExecutionResult {
  success: boolean
  plot_base64?: string
  stdout?: string
  stderr?: string
  error?: string
  message?: string
}

export async function runRCode(code: string, csvData?: string): Promise<RExecutionResult> {
  const response = await fetch("https://huggingface.co/spaces/ShayanShah1124/cReate/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      code  // Your Python backend only needs the code
    }),
  });

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Hugging Face R API returned ${response.status}: ${errorText}`
    
    if (response.status === 404) {
      errorMessage += '\n\n🔧 The Hugging Face Space might not be accessible or the endpoint path might be incorrect.'
      errorMessage += '\nPlease check:'
      errorMessage += '\n1. Is the Space URL correct?'
      errorMessage += '\n2. Is the Space publicly accessible?'
      errorMessage += '\n3. Is the Space running (not sleeping)?'
      errorMessage += '\n4. Is the endpoint path correct?'
    } else if (response.status === 503) {
      errorMessage += '\n\n🔧 The Hugging Face Space might be sleeping or starting up.'
      errorMessage += '\nPlease wait a moment and try again.'
    }
    
    throw new Error(errorMessage)
  }
  
  return await response.json()
}

/**
 * Convert a File object to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

/**
 * Execute R code with optional CSV file
 */
export async function executeRCodeWithFile(code: string, file?: File): Promise<RExecutionResult> {
  let csvBase64: string | undefined
  
  if (file) {
    csvBase64 = await fileToBase64(file)
  }
  
  return runRCode(code, csvBase64)
}
