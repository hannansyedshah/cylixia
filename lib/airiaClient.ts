/**
 * Airia API Client
 * Connects to your Airia agent for R code generation
 */

interface AiriaRequest {
  userId: string
  userInput: string
  asyncOutput: boolean
  csvData?: string
  fileName?: string
}

interface AiriaResponse {
  output?: string
  result?: any
  error?: string
  rCode?: string
  message?: string
}

const AIRIA_API_URL_LEGACY = 'https://api.airia.ai/v2/PipelineExecution/3b015c24-44cf-400c-aac7-437fb5963f63'
const AIRIA_API_URL_QUICK = 'https://api.airia.ai/v2/PipelineExecution/3679b604-284a-40fc-9ebc-e77362d144f6'

export async function callAiriaAgent(
  userInput: string,
  userId: string = 'default-user',
  csvData?: string,
  fileName?: string,
  mode: 'legacy' | 'quick' = 'legacy',
  existingCode?: string,
  conversationHistory?: string,
  preferences?: { style?: string; libraries?: string[] }
): Promise<AiriaResponse> {
  try {
    const apiKey = process.env.AIRIA_API_KEY

    if (!apiKey) {
      throw new Error('AIRIA_API_KEY not configured in environment variables')
    }

    let targetUrl = AIRIA_API_URL_LEGACY
    let payload: AiriaRequest

    if (mode === 'quick') {
      targetUrl = AIRIA_API_URL_QUICK
      const quickInput = {
        dataset_info: fileName ? `File: ${fileName}` : 'No dataset provided',
        user_request: userInput,
        existing_code: existingCode || '',
        conversation_history: conversationHistory || '',
        preferences: {
          style: preferences?.style || 'publication-ready',
          // Do NOT include tidyverse; list packages individually
          libraries: preferences?.libraries || [
            'ggplot2', 'dplyr', 'readr', 'tidyr', 'stringr', 'purrr', 'tibble', 'forcats'
          ]
        }
      }
      payload = {
        userId,
        userInput: JSON.stringify(quickInput),
        asyncOutput: false,
        csvData,
        fileName
      }
    } else {
      // legacy behavior: embed brief CSV context into userInput
      let enhancedInput = userInput
      if (csvData && fileName) {
        enhancedInput = `${userInput}

Current R Code:\n\n${existingCode || ''}

Dataset: ${fileName}
CSV Data (first 1000 chars):
${csvData.substring(0, 1000)}${csvData.length > 1000 ? '...' : ''}

Please return ONLY full R code with necessary library() calls.`
      }
      payload = {
        userId,
        userInput: enhancedInput,
        asyncOutput: false,
        csvData,
        fileName
      }
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Airia API Response:', errorText)
      throw new Error(`Airia API error: ${response.status} ${response.statusText}`)
    }

    const data: AiriaResponse = await response.json()
    return data
  } catch (error: any) {
    console.error('Airia API Error:', error)
    throw new Error(`Failed to get response from Airia: ${error.message}`)
  }
}

/**
 * Parse R code and message from Airia response
 */
export function parseAiriaResponse(airiaData: AiriaResponse): { code: string, message: string } {
  const responseText = airiaData.output || airiaData.result || ''
  
  // If Airia returns structured data
  if (airiaData.rCode) {
    return {
      code: airiaData.rCode,
      message: airiaData.message || 'Here\'s the R code for your request:'
    }
  }

  // Try to parse structured JSON in output/result for quick mode
  try {
    const parsed = typeof responseText === 'string' ? JSON.parse(responseText) : responseText
    if (parsed && parsed.r_code) {
      return {
        code: parsed.r_code,
        message: parsed.explanation || 'Here\'s the R code for your request:'
      }
    }
  } catch {}
  
  // Extract code from response text
  const codeBlockMatch = responseText.match(/```r?\n([\s\S]*?)```/)
  if (codeBlockMatch) {
    const code = codeBlockMatch[1].trim()
    const message = responseText.replace(/```r?\n[\s\S]*?```/, '').trim() || 'Here\'s the R code:'
    return { code, message }
  }

  // If entire response looks like R code
  if (responseText.includes('library(') || responseText.includes('ggplot(') || responseText.includes('<-')) {
    return {
      code: responseText.trim(),
      message: 'Here\'s the R code for your request:'
    }
  }

  // Otherwise, treat as message with code mixed in
  return {
    code: responseText.trim(),
    message: 'Response from Airia:'
  }
}

