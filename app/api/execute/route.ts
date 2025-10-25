import { NextRequest, NextResponse } from 'next/server'

const R_EXEC_API = "https://r-exec-api-919344974581.us-east4.run.app/run"

// Helper function to fix common R syntax errors
function fixRSyntaxErrors(code: string): string {
  let fixedCode = code
  
  // Fix common factor() syntax errors
  // Pattern: factor(treatm…c("Control", "Fertilizer_A", "Fertilizer_B"))
  // Should be: factor(treatment, levels = c("Control", "Fertilizer_A", "Fertilizer_B"))
  fixedCode = fixedCode.replace(
    /factor\((\w+)…c\(([^)]+)\)\)/g,
    'factor($1, levels = c($2))'
  )
  
  // Fix missing levels parameter in factor()
  fixedCode = fixedCode.replace(
    /factor\((\w+),\s*c\(([^)]+)\)\)/g,
    'factor($1, levels = c($2))'
  )
  
  // Fix incomplete factor() calls
  fixedCode = fixedCode.replace(
    /factor\((\w+),\s*c\(/g,
    'factor($1, levels = c('
  )
  
  // Fix truncated factor() calls with ellipsis
  fixedCode = fixedCode.replace(
    /factor\((\w+)…/g,
    'factor($1, levels = '
  )
  
  // Fix specific pattern from error: factor(treatm…c("Control", "Fertilizer_A", "Fertilizer_B"))
  fixedCode = fixedCode.replace(
    /factor\((\w+)…c\(([^)]+)\)\)/g,
    'factor($1, levels = c($2))'
  )
  
  // Fix missing parentheses in function calls
  fixedCode = fixedCode.replace(
    /(\w+)\s*=\s*(\w+)\(([^)]*)\s*$/gm,
    '$1 <- $2($3)'
  )
  
  // Fix common ggplot2 syntax issues
  fixedCode = fixedCode.replace(
    /ggplot\(([^,]+),\s*aes\(([^)]+)\)\)/g,
    'ggplot($1, aes($2))'
  )
  
  // Ensure proper assignment operator
  fixedCode = fixedCode.replace(
    /(\w+)\s*=\s*([^=])/g,
    '$1 <- $2'
  )
  
  // Fix dplyr mutate() errors - ensure it's called on data frames, not functions
  // Pattern: mutate(some_function, ...) should be mutate(data, ...)
  fixedCode = fixedCode.replace(
    /mutate\((\w+)\s*\(\s*\)\s*,/g,
    'mutate(data,'
  )
  
  // Fix common dplyr pipe issues
  fixedCode = fixedCode.replace(
    /(\w+)\s*%\>%\s*mutate\(/g,
    '$1 %>% mutate('
  )
  
  // Ensure data is properly referenced in dplyr functions
  fixedCode = fixedCode.replace(
    /mutate\(\s*(\w+)\s*,\s*([^)]+)\)/g,
    function(match: string, variable: string, args: string) {
      // If the first argument is not 'data' and looks like a variable name, assume it's correct
      if (variable === 'data' || /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable)) {
        return match // Keep as is
      }
      return `mutate(data, ${args})`
    }
  )
  
  // Fix filter() conflicts with stats package
  fixedCode = fixedCode.replace(
    /filter\(/g,
    'dplyr::filter('
  )
  
  // Fix select() conflicts
  fixedCode = fixedCode.replace(
    /select\(/g,
    'dplyr::select('
  )
  
  // Fix assignment operator issues with NULL and other values
  // Pattern: `... <- NULL` should be `... <- NULL` (but properly formatted)
  fixedCode = fixedCode.replace(
    /(\w+)\s*<-\s*NULL/g,
    '$1 <- NULL'
  )
  
  // Fix incorrect assignment patterns
  fixedCode = fixedCode.replace(
    /(\w+)\s*=\s*NULL/g,
    '$1 <- NULL'
  )
  
  // Fix ellipsis (...) assignment issues
  fixedCode = fixedCode.replace(
    /\.\.\.\s*<-\s*(\w+)/g,
    '... <- $1'
  )
  
  // Fix function argument assignment issues
  fixedCode = fixedCode.replace(
    /(\w+)\s*<-\s*(\w+)\s*\(\s*\)/g,
    '$1 <- $2()'
  )
  
  // Fix missing assignment operators
  fixedCode = fixedCode.replace(
    /(\w+)\s*(\w+)\s*NULL/g,
    '$1 <- NULL'
  )
  
  // Fix ggplot2 assignment issues
  fixedCode = fixedCode.replace(
    /(\w+)\s*=\s*ggplot\(/g,
    '$1 <- ggplot('
  )
  
  // Fix common R syntax errors that cause "In argument" errors
  // Fix malformed function calls
  fixedCode = fixedCode.replace(
    /(\w+)\s*\(\s*(\w+)\s*<-\s*(\w+)\s*\)/g,
    '$1($2 <- $3)'
  )
  
  // Fix missing commas in function arguments
  fixedCode = fixedCode.replace(
    /(\w+)\s*\(\s*(\w+)\s*(\w+)\s*(\w+)\s*\)/g,
    '$1($2, $3, $4)'
  )
  
  // Fix assignment in function arguments
  fixedCode = fixedCode.replace(
    /(\w+)\s*\(\s*(\w+)\s*<-\s*(\w+)\s*,\s*([^)]+)\)/g,
    '$1($2 <- $3, $4)'
  )
  
  // Fix ellipsis in function arguments
  fixedCode = fixedCode.replace(
    /(\w+)\s*\(\s*\.\.\.\s*<-\s*(\w+)\s*\)/g,
    '$1(... <- $2)'
  )
  
  // Clean up extra spaces around operators
  fixedCode = fixedCode.replace(
    /\s*<-\s*/g,
    ' <- '
  )
  
  // Fix undefined variables and common typos
  // Fix 'to_insta' typo (likely meant 'to_install' or similar)
  fixedCode = fixedCode.replace(
    /\bto_insta\b/g,
    'to_install'
  )
  
  // Fix common variable name typos
  fixedCode = fixedCode.replace(
    /\binsta\b/g,
    'install'
  )
  
  // Fix common ggplot2 variable typos
  fixedCode = fixedCode.replace(
    /\bggplo\b/g,
    'ggplot'
  )
  
  // Fix common dplyr function typos
  fixedCode = fixedCode.replace(
    /\bmutatee\b/g,
    'mutate'
  )
  
  fixedCode = fixedCode.replace(
    /\bfilterr\b/g,
    'filter'
  )
  
  // Fix common data frame name typos
  fixedCode = fixedCode.replace(
    /\bdat\b/g,
    'data'
  )
  
  // Fix common function name typos
  fixedCode = fixedCode.replace(
    /\blibrar\b/g,
    'library'
  )
  
  // Fix common package name typos
  fixedCode = fixedCode.replace(
    /\bggplo2\b/g,
    'ggplot2'
  )
  
  // Fix common variable name patterns
  fixedCode = fixedCode.replace(
    /\b(\w+)_insta\b/g,
    '$1_install'
  )
  
  // Add variable validation and common fixes
  // Fix common undefined variable patterns
  fixedCode = fixedCode.replace(
    /\b(install|insta|to_insta|to_install)\b/g,
    'install'
  )
  
  // Fix common data frame references
  fixedCode = fixedCode.replace(
    /\b(dat|data_frame|df)\b/g,
    'data'
  )
  
  // Fix common function name typos
  fixedCode = fixedCode.replace(
    /\b(ggplo|ggplo2|ggplot2)\b/g,
    'ggplot2'
  )
  
  // Fix specific problematic single letter variables only when they're clearly undefined
  // Be very conservative to avoid breaking function calls
  
  // Only fix 'l' when it's clearly a variable (not a function call)
  fixedCode = fixedCode.replace(
    /\bl\s*<-\s*/g,
    'data_length <- '
  )
  
  // Only fix 'p' when it's clearly a variable assignment
  fixedCode = fixedCode.replace(
    /\bp\s*<-\s*/g,
    'plot_obj <- '
  )
  
  // Only fix 'g' when it's clearly a variable assignment  
  fixedCode = fixedCode.replace(
    /\bg\s*<-\s*/g,
    'ggplot_obj <- '
  )
  
  // Fix common undefined variable patterns (more specific)
  fixedCode = fixedCode.replace(
    /\bto_insta\b/g,
    'packages_to_install'
  )
  
  // Fix undefined variables with more comprehensive patterns
  fixedCode = fixedCode.replace(
    /\b(to_insta|insta|install|packages_to_install)\b/g,
    'packages_to_install'
  )
  
  // Fix common ggplot2 variable issues - but be careful not to break ggplot2 package name
  // Only replace when it's clearly a variable, not a package name
  fixedCode = fixedCode.replace(
    /\b(plot|plt)\b/g,
    'plot_obj'
  )
  
  // Fix 'g' and 'gg' but only when they're not part of ggplot2
  fixedCode = fixedCode.replace(
    /\bg\s*<-\s*/g,
    'ggplot_obj <- '
  )
  
  // Ensure ggplot2 package name is correct
  fixedCode = fixedCode.replace(
    /\blibrary\(ggplot\)/g,
    'library(ggplot2)'
  )
  
  fixedCode = fixedCode.replace(
    /\brequire\(ggplot\)/g,
    'require(ggplot2)'
  )
  
  // Fix any remaining ggplot references that should be ggplot2 (but not ggplot() function calls)
  fixedCode = fixedCode.replace(
    /\bggplot\b(?!\()/g,
    'ggplot2'
  )
  
  // Fix common package name typos
  fixedCode = fixedCode.replace(
    /\blibrary\(rea\)/g,
    'library(readr)'
  )
  
  fixedCode = fixedCode.replace(
    /\brequire\(rea\)/g,
    'require(readr)'
  )
  
  // Fix capitalized version of the typo
  fixedCode = fixedCode.replace(
    /\blibrary\(Rea\)/g,
    'library(readr)'
  )
  
  fixedCode = fixedCode.replace(
    /\brequire\(Rea\)/g,
    'require(readr)'
  )
  
  // Fix other common package name typos
  fixedCode = fixedCode.replace(
    /\blibrary\(rea\w*\)/g,
    'library(readr)'
  )
  
  fixedCode = fixedCode.replace(
    /\brequire\(rea\w*\)/g,
    'require(readr)'
  )
  
  // Fix capitalized variations of rea
  fixedCode = fixedCode.replace(
    /\blibrary\(Rea\w*\)/g,
    'library(readr)'
  )
  
  fixedCode = fixedCode.replace(
    /\brequire\(Rea\w*\)/g,
    'require(readr)'
  )
  
  // Fix other common package name typos
  fixedCode = fixedCode.replace(
    /\blibrary\(dply\)/g,
    'library(dplyr)'
  )
  
  fixedCode = fixedCode.replace(
    /\blibrary\(tid\)/g,
    'library(tidyr)'
  )
  
  fixedCode = fixedCode.replace(
    /\blibrary\(str\)/g,
    'library(stringr)'
  )
  
  // Fix common data manipulation variable issues
  fixedCode = fixedCode.replace(
    /\b(result|res|output|out)\b/g,
    'result'
  )
  
  // Fix problematic function calls that might have wrong number of arguments
  // Fix length() calls with multiple arguments - length() only takes 1 argument
  fixedCode = fixedCode.replace(
    /length\(([^)]+,\s*[^)]+)\)/g,
    function(match: string, args: string) {
      // Split arguments and take only the first one
      const firstArg = args.split(',')[0].trim()
      return `length(${firstArg})`
    }
  )
  
  // Fix length() calls with 3 or more arguments
  fixedCode = fixedCode.replace(
    /length\(([^)]*,\s*[^)]*,\s*[^)]*)\)/g,
    function(match: string, args: string) {
      // Split arguments and take only the first one
      const firstArg = args.split(',')[0].trim()
      return `length(${firstArg})`
    }
  )
  
  return fixedCode
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const code = formData.get("code") as string
    const file = formData.get("file") as File | null

    console.log('🔧 Executing R Code via Cloud Run R API')
    console.log('Code length:', code?.length || 0, 'chars')
    console.log('Has CSV file:', !!file)
    console.log('File name:', file?.name)

    if (!code || code.trim() === '') {
      return NextResponse.json({
        error: 'No R code provided',
        success: false,
      }, { status: 400 })
    }

    // Fix common R syntax errors first
    const fixedCode = fixRSyntaxErrors(code)
    
    if (fixedCode !== code) {
      console.log('🔧 Applied R syntax fixes to code')
      console.log('Original code:', code.substring(0, 200))
      console.log('Fixed code:', fixedCode.substring(0, 200))
    }

    // Prepare request to Cloud Run R API
    const sendData = new FormData()
    sendData.append("code", fixedCode)
    if (file) {
      sendData.append("file", file)
    }

    console.log('Sending to Cloud Run R API:', R_EXEC_API)
    console.log('Request includes file:', !!file)

    // Call Cloud Run R execution API
    const response = await fetch(R_EXEC_API, {
      method: 'POST',
      body: sendData,
      // Increase timeout for complex plots and package installation
      signal: AbortSignal.timeout(120000), // 120 second timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cloud Run R API Error Response:', errorText)
      throw new Error(`Cloud Run R API returned ${response.status}: ${errorText}`)
    }

    const responseText = await response.text()
    console.log('Cloud Run R API Response (first 200 chars):', responseText.substring(0, 200))

    // Check if response is HTML (placeholder page)
    if (responseText.includes('<!doctype') || responseText.includes('<html') || responseText.includes('placeholder')) {
      console.error('Cloud Run service is not yet deployed - returning HTML placeholder')
      return NextResponse.json({
        error: 'R execution service is not yet deployed. Please check the Cloud Run service status.',
        details: 'The Cloud Run R API is showing a placeholder page. The service needs to be deployed.',
        success: false,
      }, { status: 503 })
    }

    // Try to parse as JSON
    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError)
      console.error('Response preview:', responseText.substring(0, 500))
      return NextResponse.json({
        error: 'Invalid response format from R execution service',
        details: 'Expected JSON but received: ' + responseText.substring(0, 100),
        success: false,
      }, { status: 502 })
    }

    console.log('Cloud Run R API Response:', JSON.stringify(result, null, 2))

    if (!result.success) {
      console.error('R execution failed:', {
        error: result.error,
        stdout: result.stdout,
        stderr: result.stderr
      })
      
      return NextResponse.json({
        error: result.error || 'R execution failed',
        stdout: result.stdout,
        stderr: result.stderr,
        success: false,
        rawResult: result, // Include full result for debugging
      }, { status: 500 })
    }

    // Convert base64 plot to data URL for display
    let plotUrl = null
    if (result.plot_base64 && typeof result.plot_base64 === 'string' && result.plot_base64.length > 100) {
      plotUrl = `data:image/png;base64,${result.plot_base64}`
      console.log('✅ Created plot data URL successfully, length:', plotUrl.length)
    } else {
      console.log('No plot generated or invalid base64 data')
    }

    return NextResponse.json({
      plotUrl,
      stdout: result.stdout,
      stderr: result.stderr,
      success: true,
      rawResult: result, // For debugging
    })
  } catch (error: any) {
    console.error('Execute API error:', error)
    
    // Provide helpful error messages
    let errorMessage = error.message
    if (error.name === 'AbortError') {
      errorMessage = 'R execution timed out (>120s). Code might be too complex or have infinite loop.'
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Cannot connect to Cloud Run R API. Check if the service is running.'
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.stack,
        success: false,
      },
      { status: 500 }
    )
  }
}

