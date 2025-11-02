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
  csvFiles?: Array<{ fileName: string, csvData: string }>
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
const AIRIA_API_URL_ASK = 'https://api.airia.ai/v2/PipelineExecution/c91515d7-b957-4ada-b94d-5bf1470be7da'

export async function callAiriaAgent(
  userInput: string,
  userId: string = 'default-user',
  csvData?: string,
  fileName?: string,
  mode: 'legacy' | 'quick' | 'ask' = 'legacy',
  existingCode?: string,
  conversationHistory?: string,
  preferences?: { style?: string; libraries?: string[] },
  csvFiles?: Array<{ fileName: string, csvData: string }>
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
      // Build dataset info from all CSV files
      let datasetInfo = 'No dataset provided'
      if (csvFiles && csvFiles.length > 0) {
        datasetInfo = csvFiles.map(f => `File: ${f.fileName}`).join(', ')
      } else if (fileName) {
        datasetInfo = `File: ${fileName}`
      }
      
      const quickInput = {
        dataset_info: datasetInfo,
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
      
      // Use first CSV file for backward compatibility, or combine all CSV files
      const primaryCsvData = csvFiles && csvFiles.length > 0 
        ? csvFiles[0].csvData 
        : csvData
      const primaryFileName = csvFiles && csvFiles.length > 0 
        ? csvFiles[0].fileName 
        : fileName
      
      payload = {
        userId,
        userInput: JSON.stringify(quickInput),
        asyncOutput: false,
        csvData: primaryCsvData,
        fileName: primaryFileName,
        ...(csvFiles && csvFiles.length > 1 ? { csvFiles } : {})
      }
      
      console.log(`📊 Quick mode: Sending CSV data - Files: ${csvFiles?.length || (csvData ? 1 : 0)}, Primary: ${primaryFileName}`)
    } else if (mode === 'ask') {
      targetUrl = AIRIA_API_URL_ASK
      // Build dataset info from all CSV files
      let datasetInfo = 'No dataset provided'
      if (csvFiles && csvFiles.length > 0) {
        datasetInfo = csvFiles.map(f => `File: ${f.fileName}`).join(', ')
      } else if (fileName) {
        datasetInfo = `File: ${fileName}`
      }
      
      // Ask mode: similar structure to quick, optimized for data questions
      const askInput = {
        dataset_info: datasetInfo,
        user_request: userInput,
        existing_code: existingCode || '',
        conversation_history: conversationHistory || '',
        preferences: {
          style: preferences?.style || 'publication-ready',
          libraries: preferences?.libraries || [
            'ggplot2', 'dplyr', 'readr', 'tidyr', 'stringr', 'purrr', 'tibble', 'forcats'
          ]
        }
      }
      
      // Use first CSV file for backward compatibility, or combine all CSV files
      const primaryCsvData = csvFiles && csvFiles.length > 0 
        ? csvFiles[0].csvData 
        : csvData
      const primaryFileName = csvFiles && csvFiles.length > 0 
        ? csvFiles[0].fileName 
        : fileName
      
      payload = {
        userId,
        userInput: JSON.stringify(askInput),
        asyncOutput: false,
        csvData: primaryCsvData,
        fileName: primaryFileName,
        ...(csvFiles && csvFiles.length > 1 ? { csvFiles } : {})
      }
      
      console.log(`📊 Ask mode: Sending CSV data - Files: ${csvFiles?.length || (csvData ? 1 : 0)}, Primary: ${primaryFileName}`)
    } else {
      // legacy behavior: embed brief CSV context into userInput
      let enhancedInput = userInput
      
      // Use first CSV file for legacy mode, or fall back to single csvData
      const primaryCsvData = csvFiles && csvFiles.length > 0 
        ? csvFiles[0].csvData 
        : csvData
      const primaryFileName = csvFiles && csvFiles.length > 0 
        ? csvFiles[0].fileName 
        : fileName
      
      // Include info about all CSV files
      if (csvFiles && csvFiles.length > 0) {
        const fileList = csvFiles.map(f => f.fileName).join(', ')
        enhancedInput = `${userInput}

Current R Code:\n\n${existingCode || ''}

Datasets: ${fileList}
CSV Data (first file, first 1000 chars):
${primaryCsvData.substring(0, 1000)}${primaryCsvData.length > 1000 ? '...' : ''}

Please return ONLY full R code with necessary library() calls.`
      } else if (primaryCsvData && primaryFileName) {
        enhancedInput = `${userInput}

Current R Code:\n\n${existingCode || ''}

Dataset: ${primaryFileName}
CSV Data (first 1000 chars):
${primaryCsvData.substring(0, 1000)}${primaryCsvData.length > 1000 ? '...' : ''}

Please return ONLY full R code with necessary library() calls.`
      }
      
      payload = {
        userId,
        userInput: enhancedInput,
        asyncOutput: false,
        csvData: primaryCsvData,
        fileName: primaryFileName,
        ...(csvFiles && csvFiles.length > 1 ? { csvFiles } : {})
      }
      
      console.log(`📊 Legacy mode: Sending CSV data - Files: ${csvFiles?.length || (csvData ? 1 : 0)}, Primary: ${primaryFileName}`)
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

