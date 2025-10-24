/**
 * Airia API Client
 * Connects to your Airia agent for R code generation
 */

interface AiriaRequest {
  userId: string
  userInput: string
  asyncOutput: boolean
}

interface AiriaResponse {
  output?: string
  result?: any
  error?: string
}

const AIRIA_API_URL = 'https://api.airia.ai/v2/PipelineExecution/3b015c24-44cf-400c-aac7-437fb5963f63'

export async function callAiriaAgent(
  userInput: string,
  userId: string = 'default-user'
): Promise<string> {
  try {
    const apiKey = process.env.AIRIA_API_KEY

    if (!apiKey) {
      throw new Error('AIRIA_API_KEY not configured in environment variables')
    }

    const payload: AiriaRequest = {
      userId,
      userInput,
      asyncOutput: false
    }

    const response = await fetch(AIRIA_API_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Airia API error: ${response.status} ${response.statusText}`)
    }

    const data: AiriaResponse = await response.json()

    // Extract the output from Airia response
    return data.output || data.result || 'No response from Airia'
  } catch (error: any) {
    console.error('Airia API Error:', error)
    throw new Error(`Failed to get response from Airia: ${error.message}`)
  }
}

/**
 * Parse R code from Airia response
 * Airia might return code in various formats, this extracts it
 */
export function extractRCode(airiaResponse: string): string {
  // Check if response contains code blocks
  const codeBlockMatch = airiaResponse.match(/```r?\n([\s\S]*?)```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  // Check if response is already pure R code
  if (airiaResponse.includes('library(') || airiaResponse.includes('ggplot(')) {
    return airiaResponse.trim()
  }

  // Return as-is if no clear code block found
  return airiaResponse.trim()
}

