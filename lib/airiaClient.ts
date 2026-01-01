/**
 * Airia API Client
 * Connects to your Airia agent for R code generation
 */

import type { AiriaRequest, AiriaResponse } from '@/types'

const AIRIA_API_URL_LEGACY = 'https://api.airia.ai/v2/PipelineExecution/3b015c24-44cf-400c-aac7-437fb5963f63'
const AIRIA_API_URL_QUICK = 'https://api.airia.ai/v2/PipelineExecution/3679b604-284a-40fc-9ebc-e77362d144f6'
const AIRIA_API_URL_ASK = 'https://api.airia.ai/v2/PipelineExecution/c91515d7-b957-4ada-b94d-5bf1470be7da'
// Same agent for NIST ask mode - the agent routes internally based on context_window presence
const AIRIA_API_URL_ASK_NIST = 'https://api.airia.ai/v2/PipelineExecution/c91515d7-b957-4ada-b94d-5bf1470be7da'
const AIRIA_API_URL_CONTEXT = 'https://api.airia.ai/v2/PipelineExecution/f6015c53-afc1-4dff-bcfd-f9facce101cd'

export async function callAiriaAgent(
  userInput: string,
  userId: string = 'default-user',
  csvData?: string,
  fileName?: string,
  mode: 'legacy' | 'quick' | 'ask' = 'legacy',
  existingCode?: string,
  conversationHistory?: string,
  preferences?: { style?: string; libraries?: string[] },
  csvFiles?: Array<{ fileName: string, csvData: string }>,
  privacyMode: boolean = true,
  contextWindow?: string,
  isNistProject: boolean = false
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
      
      // Use first CSV file for backward compatibility, or combine all CSV files
      const primaryCsvData = csvFiles && csvFiles.length > 0 
        ? csvFiles[0].csvData 
        : csvData
      const primaryFileName = csvFiles && csvFiles.length > 0 
        ? csvFiles[0].fileName 
        : fileName
      
      // Build dataset info from all CSV files
      let datasetInfo = 'No dataset provided'
      if (csvFiles && csvFiles.length > 0) {
        datasetInfo = csvFiles.map(f => `File: ${f.fileName}`).join(', ')
      } else if (fileName) {
        datasetInfo = `File: ${fileName}`
      }
      
      // Build CSV data section with actual content from all files
      const dataPrivacyNote = privacyMode 
        ? '⚠️ NOTE: This CSV data has been RANDOMIZED for privacy protection. Use this for analysis structure only, not for actual values.'
        : '✓ NOTE: This is ORIGINAL CSV data. Values are real and should be used for actual analysis.'
      
      let csvDataInfo = 'No CSV data provided'
      if (csvFiles && csvFiles.length > 0) {
        if (csvFiles.length === 1) {
          // Single file: include full data description
          csvDataInfo = `${dataPrivacyNote}\n\nFile: ${csvFiles[0].fileName}\nData size: ${csvFiles[0].csvData.length} characters\nFirst 500 chars:\n${csvFiles[0].csvData.substring(0, 500)}${csvFiles[0].csvData.length > 500 ? '...' : ''}`
        } else {
          // Multiple files: include info about each
          csvDataInfo = `${dataPrivacyNote}\n\nCSV Files:\n`
          csvDataInfo += csvFiles.map((f, i) => 
            `File ${i + 1}: ${f.fileName} (${f.csvData.length} chars)\nFirst 300 chars:\n${f.csvData.substring(0, 300)}...`
          ).join('\n\n')
        }
      } else if (primaryCsvData) {
        csvDataInfo = `${dataPrivacyNote}\n\nFile: ${primaryFileName}\nData size: ${primaryCsvData.length} characters\nFirst 500 chars:\n${primaryCsvData.substring(0, 500)}${primaryCsvData.length > 500 ? '...' : ''}`
      }
      
      const quickInput = {
        dataset_info: `${datasetInfo}\n\nCSV Data Content:\n${csvDataInfo}`,
        user_request: userInput,
        existing_code: existingCode || '',
        conversation_history: conversationHistory || '',
        preferences: {
          style: preferences?.style || 'publication-ready',
          // Do NOT include tidyverse; list packages individually
          libraries: preferences?.libraries || [
            'ggplot2', 'dplyr', 'readr', 'tidyr', 'stringr', 'purrr', 'tibble', 'forcats'
          ]
        },
        context_window: contextWindow || ''
      }
      
      payload = {
        userId,
        userInput: JSON.stringify(quickInput),
        asyncOutput: false,
        csvData: primaryCsvData,
        fileName: primaryFileName,
        ...(csvFiles && csvFiles.length > 0 ? { csvFiles } : {}),
        // Send context_window as separate field for router detection
        ...(contextWindow ? { context_window: contextWindow } : {})
      }
      
      console.log(`📊 Quick mode: Sending CSV data - Files: ${csvFiles?.length || (csvData ? 1 : 0)}, Primary: ${primaryFileName}`)
      if (csvFiles && csvFiles.length > 0) {
        csvFiles.forEach((f, i) => {
          console.log(`  CSV File ${i + 1}/${csvFiles.length}: ${f.fileName} (${f.csvData.length} chars)`)
        })
      }
    } else if (mode === 'ask') {
      // Use same ask agent for both - it routes internally based on context_window
      targetUrl = AIRIA_API_URL_ASK
      console.log(`🔀 Ask mode: ${isNistProject ? 'Route 2 (NIST with context)' : 'Route 1 (Regular)'}`)
      // Use first CSV file for backward compatibility, or combine all CSV files
      const primaryCsvData = csvFiles && csvFiles.length > 0 
        ? csvFiles[0].csvData 
        : csvData
      const primaryFileName = csvFiles && csvFiles.length > 0 
        ? csvFiles[0].fileName 
        : fileName
      
      // Build dataset info from all CSV files
      let datasetInfo = 'No dataset provided'
      if (csvFiles && csvFiles.length > 0) {
        datasetInfo = csvFiles.map(f => `File: ${f.fileName}`).join(', ')
      } else if (fileName) {
        datasetInfo = `File: ${fileName}`
      }
      
      // Build CSV data section with actual content from all files
      const dataPrivacyNote = privacyMode 
        ? '⚠️ NOTE: This CSV data has been RANDOMIZED for privacy protection. Use this for analysis structure only, not for actual values.'
        : '✓ NOTE: This is ORIGINAL CSV data. Values are real and should be used for actual analysis.'
      
      let csvDataInfo = 'No CSV data provided'
      if (csvFiles && csvFiles.length > 0) {
        if (csvFiles.length === 1) {
          // Single file: include full data description
          csvDataInfo = `${dataPrivacyNote}\n\nFile: ${csvFiles[0].fileName}\nData size: ${csvFiles[0].csvData.length} characters\nFirst 500 chars:\n${csvFiles[0].csvData.substring(0, 500)}${csvFiles[0].csvData.length > 500 ? '...' : ''}`
        } else {
          // Multiple files: include info about each
          csvDataInfo = `${dataPrivacyNote}\n\nCSV Files:\n`
          csvDataInfo += csvFiles.map((f, i) => 
            `File ${i + 1}: ${f.fileName} (${f.csvData.length} chars)\nFirst 300 chars:\n${f.csvData.substring(0, 300)}...`
          ).join('\n\n')
        }
      } else if (primaryCsvData) {
        csvDataInfo = `${dataPrivacyNote}\n\nFile: ${primaryFileName}\nData size: ${primaryCsvData.length} characters\nFirst 500 chars:\n${primaryCsvData.substring(0, 500)}${primaryCsvData.length > 500 ? '...' : ''}`
      }
      
      // Ask mode: similar structure to quick, optimized for data questions
      const askInput = {
        dataset_info: `${datasetInfo}\n\nCSV Data Content:\n${csvDataInfo}`,
        user_request: userInput,
        existing_code: existingCode || '',
        conversation_history: conversationHistory || '',
        preferences: {
          style: preferences?.style || 'publication-ready',
          libraries: preferences?.libraries || [
            'ggplot2', 'dplyr', 'readr', 'tidyr', 'stringr', 'purrr', 'tibble', 'forcats'
          ]
        },
        context_window: contextWindow || ''
      }
      
      payload = {
        userId,
        userInput: JSON.stringify(askInput),
        asyncOutput: false,
        csvData: primaryCsvData,
        fileName: primaryFileName,
        ...(csvFiles && csvFiles.length > 0 ? { csvFiles } : {}),
        // Send context_window as separate field for router detection
        ...(contextWindow ? { context_window: contextWindow } : {})
      }
      
      console.log(`📊 Ask mode: Sending CSV data - Files: ${csvFiles?.length || (csvData ? 1 : 0)}, Primary: ${primaryFileName}`)
      if (csvFiles && csvFiles.length > 0) {
        csvFiles.forEach((f, i) => {
          console.log(`  CSV File ${i + 1}/${csvFiles.length}: ${f.fileName} (${f.csvData.length} chars)`)
        })
      }
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
      
      // Include info about all CSV files with their data
      const dataPrivacyNote = privacyMode 
        ? '⚠️ NOTE: This CSV data has been RANDOMIZED for privacy protection. Use this for analysis structure only, not for actual values.'
        : '✓ NOTE: This is ORIGINAL CSV data. Values are real and should be used for actual analysis.'
      
      if (csvFiles && csvFiles.length > 0) {
        const fileList = csvFiles.map(f => f.fileName).join(', ')
        let csvDataSection = ''
        
        // Include data from all CSV files
        if (csvFiles.length === 1) {
          // Single file: include full data (first 5000 chars to avoid token limits)
          csvDataSection = `${dataPrivacyNote}\n\nDataset: ${csvFiles[0].fileName}\nCSV Data (first 5000 chars):\n${csvFiles[0].csvData.substring(0, 5000)}${csvFiles[0].csvData.length > 5000 ? '\n... (truncated)' : ''}`
        } else {
          // Multiple files: include data from each (first 2000 chars each)
          csvDataSection = `${dataPrivacyNote}\n\nDatasets: ${fileList}\n\nCSV Data:\n`
          csvFiles.forEach((f, i) => {
            csvDataSection += `\n--- File ${i + 1}: ${f.fileName} (${f.csvData.length} chars) ---\n`
            csvDataSection += `${f.csvData.substring(0, 2000)}${f.csvData.length > 2000 ? '\n... (truncated)' : ''}\n`
          })
        }
        
        enhancedInput = `${userInput}

Current R Code:\n\n${existingCode || ''}

${csvDataSection}

${contextWindow ? `\n\nResearch Context:\n${contextWindow}\n` : ''}

Please return ONLY full R code with necessary library() calls.`
      } else if (primaryCsvData && primaryFileName) {
        const dataPrivacyNote = privacyMode 
          ? '⚠️ NOTE: This CSV data has been RANDOMIZED for privacy protection. Use this for analysis structure only, not for actual values.'
          : '✓ NOTE: This is ORIGINAL CSV data. Values are real and should be used for actual analysis.'
        
        enhancedInput = `${userInput}

Current R Code:\n\n${existingCode || ''}

${dataPrivacyNote}

Dataset: ${primaryFileName}
CSV Data (first 1000 chars):
${primaryCsvData.substring(0, 1000)}${primaryCsvData.length > 1000 ? '...' : ''}

${contextWindow ? `\n\nResearch Context:\n${contextWindow}\n` : ''}

Please return ONLY full R code with necessary library() calls.`
      }
      
      payload = {
        userId,
        userInput: enhancedInput,
        asyncOutput: false,
        csvData: primaryCsvData,
        fileName: primaryFileName,
        ...(csvFiles && csvFiles.length > 0 ? { csvFiles } : {}),
        // Send context_window as separate field for router detection
        ...(contextWindow ? { context_window: contextWindow } : {})
      }
      
      console.log(`📊 Legacy mode: Sending CSV data - Files: ${csvFiles?.length || (csvData ? 1 : 0)}, Primary: ${primaryFileName}`)
      if (csvFiles && csvFiles.length > 0) {
        csvFiles.forEach((f, i) => {
          console.log(`  CSV File ${i + 1}/${csvFiles.length}: ${f.fileName} (${f.csvData.length} chars)`)
        })
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
export function parseAiriaResponse(airiaData: AiriaResponse): {
  code: string,
  message: string,
  explanation?: string,
  plotDescription?: string,
  nextSuggestions?: string[]
} {
  // Get response text, ensuring it's a string for processing
  const rawOutput = airiaData.output || airiaData.result || ''
  const responseText = typeof rawOutput === 'string' ? rawOutput : JSON.stringify(rawOutput)
  
  console.log('🔍 Parsing Airia response, responseText type:', typeof responseText)
  
  // If Airia returns structured data
  if (airiaData.rCode) {
    return {
      code: airiaData.rCode,
      message: airiaData.message || 'Here\'s the R code for your request:'
    }
  }

  // Try to parse structured JSON in output/result for quick mode
  try {
    // Clean up response text before parsing (remove bullet points, extra whitespace)
    let cleanedText = responseText
    // First, try to extract JSON from markdown code blocks
    if (responseText) {
      const jsonBlockMatch = responseText.match(/```json\s*\n?([\s\S]*?)```/)
      if (jsonBlockMatch) {
        cleanedText = jsonBlockMatch[1].trim()
      }
      
      // Clean up any remaining artifacts
      cleanedText = cleanedText
        .replace(/•\s*/g, '') // Remove bullet points
        .replace(/```json\s*/g, '') // Remove json code block markers
        .replace(/```\s*/g, '') // Remove code block markers
        .replace(/^Here's the R code.*?:\s*/i, '') // Remove "Here's the R code" prefix
        .trim()
    }
    
    const parsed = typeof cleanedText === 'string' ? JSON.parse(cleanedText) : cleanedText
    console.log('🔍 Parsed object keys:', parsed ? Object.keys(parsed) : 'null')
    
    if (parsed && ('r_code' in parsed || 'explanation' in parsed)) {
      // Extract all metadata from Airia's response
      console.log('✅ Successfully parsed Airia JSON response with metadata:', {
        hasRCode: !!parsed.r_code,
        hasExplanation: !!parsed.explanation,
        hasPlotDescription: !!parsed.plot_description,
        hasSuggestions: !!parsed.next_suggestions
      })
      
      // Clean up explanation text
      const cleanExplanation = parsed.explanation 
        ? parsed.explanation.replace(/•\s*/g, '').trim() 
        : undefined
      
      // Clean up plot description
      const cleanPlotDescription = parsed.plot_description 
        ? parsed.plot_description.replace(/•\s*/g, '').trim() 
        : undefined
      
      // Clean up suggestions (remove bullet points and emojis if needed)
      const cleanSuggestions = parsed.next_suggestions 
        ? parsed.next_suggestions.map((s: string) => s.replace(/•\s*/g, '').trim())
        : undefined
      
      return {
        code: parsed.r_code || '',
        message: '', // Don't add default message - let frontend handle it
        explanation: cleanExplanation,
        plotDescription: cleanPlotDescription,
        nextSuggestions: cleanSuggestions
      }
    } else {
      console.warn('⚠️ Parsed JSON but no r_code or explanation field found')
    }
  } catch (parseError) {
    console.warn('⚠️ Failed to parse Airia response as JSON:', parseError)
  }
  
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

/**
 * Generate research context window using AI
 * For NIST-compliant projects
 */
export async function generateContextWindow(
  projectName: string,
  csvFiles: Array<{ fileName: string, csvData: string }>,
  userId: string = 'default-user'
): Promise<string> {
  try {
    // Use dedicated context API key if available, otherwise fall back to main key
    const apiKey = process.env.AIRIA_CONTEXT_API_KEY || process.env.AIRIA_API_KEY

    if (!apiKey) {
      throw new Error('AIRIA_CONTEXT_API_KEY or AIRIA_API_KEY not configured in environment variables')
    }

    // Build the context generation request with full CSV data
    // The API expects CSV file(s) with name and data, and returns a template
    const contextInput = {
      project_name: projectName,
      csv_files: csvFiles.map(file => ({
        file_name: file.fileName,
        csv_data: file.csvData // Send full CSV data, not just preview
      })),
      format_instructions: `Analyze the provided CSV data and generate a research context in EXACTLY this format:

Study Type: [Infer the study type - e.g., Clinical trial, Observational study, Cross-sectional study, Longitudinal study]

Objective: [Infer the main research objective based on the data structure and variables - be specific about what relationships or outcomes are being studied]

Dataset Key Fields: [List the most important column names from the CSV files, comma-separated]

Preferred Analysis Types: [Suggest 3-5 appropriate statistical analyses based on the data - e.g., Linear regression, Logistic regression, Survival analysis, ANOVA, t-test, Chi-square, Descriptive statistics]

Additional Notes: [Include any important observations about the dataset structure, potential confounders, data quality issues, or analysis considerations]

IMPORTANT: Return ONLY the template above with values filled in. Do NOT include markdown formatting, headers, code blocks, or extra explanations. Just return the plain text template.`
    }

    const payload = {
      userId,
      userInput: JSON.stringify(contextInput),
      asyncOutput: false
    }

    console.log('🔍 Generating context window via Airia...')
    console.log(`📂 Sending ${csvFiles.length} CSV file(s) for context generation`)

    const response = await fetch(AIRIA_API_URL_CONTEXT, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Context generation API Response:', errorText)
      throw new Error(`Context API error: ${response.status} ${response.statusText}`)
    }

    const data: AiriaResponse = await response.json()
    const contextText = data.output || data.result || ''

    // If response is a string, return it
    if (typeof contextText === 'string') {
      console.log('✅ Context template received from API')
      return contextText
    }

    // Otherwise try to extract from structured response
    return JSON.stringify(contextText, null, 2)
  } catch (error: any) {
    console.error('Context generation error:', error)
    // Return a default template on error
    return generateDefaultContextTemplate(projectName, csvFiles)
  }
}

/**
 * Generate a default context template
 */
function generateDefaultContextTemplate(
  projectName: string,
  csvFiles: Array<{ fileName: string, csvData: string }>
): string {
  const fileNames = csvFiles.map(f => f.fileName).join(', ')
  
  // Extract column headers from CSV files
  let keyFields = 'Not specified'
  if (csvFiles && csvFiles.length > 0) {
    const headers = csvFiles.map(file => {
      const lines = file.csvData.split('\n')
      return lines[0] || ''
    }).filter(Boolean)
    if (headers.length > 0) {
      keyFields = headers.join(' | ')
    }
  }

  return `Study Type: [e.g., Clinical trial, Observational study, Epidemiological research]

Objective: [e.g., Analyze the relationship between treatment and patient outcomes]

Dataset Key Fields: ${keyFields}

Dataset Files: ${fileNames || 'No files uploaded'}

Privacy Setting: NIST-compliant mode ✅
All PHI fields are treated as de-identified tokens. No raw identifiers are logged or exported.

Preferred Analysis Types: [e.g., Linear regression, Logistic regression, Survival analysis, ANOVA, Descriptive statistics]

Additional Notes: [Any specific requirements, constraints, or context about this research project]`
}

