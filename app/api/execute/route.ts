import { NextRequest, NextResponse } from 'next/server'

const R_API_URL = process.env.R_EXECUTION_API_URL || 'https://r-exec-api.onrender.com/run'

export async function POST(request: NextRequest) {
  try {
    const { code, csvData } = await request.json()

    console.log('🔧 Executing R Code via Render API')
    console.log('Code length:', code?.length || 0, 'chars')
    console.log('Has CSV data:', !!csvData)

    if (!code || code.trim() === '') {
      return NextResponse.json({
        error: 'No R code provided',
        success: false,
      }, { status: 400 })
    }

    // Prepare R code with CSV data if provided
    let fullCode = code
    if (csvData) {
      // Inject CSV data into R environment
      fullCode = `# Load CSV data from upload
data <- read.csv(text='${csvData.replace(/'/g, "\\'")}')

# Execute user code
${code}
`
    }

    console.log('Sending to R API:', R_API_URL)

    // Call your Render R execution API
    const response = await fetch(R_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: fullCode }),
      // Add timeout
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('R API Error Response:', errorText)
      throw new Error(`R API returned ${response.status}: ${errorText}`)
    }

    const result = await response.json()

    console.log('R API Full Response:', JSON.stringify(result, null, 2))

    // R returns data in arrays/objects, need to extract properly
    // success might be [TRUE] or {0: TRUE}
    const isSuccess = Array.isArray(result.success) 
      ? result.success[0] 
      : typeof result.success === 'object'
        ? result.success[0] || Object.values(result.success)[0]
        : result.success

    console.log('Parsed success:', isSuccess)

    if (!isSuccess) {
      const errorMsg = Array.isArray(result.error) ? result.error[0] : result.error
      return NextResponse.json({
        error: errorMsg || 'R execution failed',
        output: JSON.stringify(result.output),
        success: false,
      }, { status: 500 })
    }

    // Extract base64 from R's array/object structure
    let base64String = null
    
    console.log('plot_base64 type:', typeof result.plot_base64)
    console.log('plot_base64 is array:', Array.isArray(result.plot_base64))
    
    // R Plumber returns arrays: plot_base64: ["iVBORw..."]
    if (Array.isArray(result.plot_base64) && result.plot_base64.length > 0) {
      base64String = String(result.plot_base64[0])
      console.log('✅ Extracted from array, first 50 chars:', base64String.substring(0, 50))
    }
    // Or as object {0: "data..."}
    else if (result.plot_base64 && typeof result.plot_base64 === 'object' && !Array.isArray(result.plot_base64)) {
      const values = Object.values(result.plot_base64)
      if (values.length > 0) {
        base64String = String(values[0])
        console.log('✅ Extracted from object')
      }
    }
    // Or direct string (unlikely with R)
    else if (typeof result.plot_base64 === 'string') {
      base64String = result.plot_base64
      console.log('✅ Direct string')
    }

    console.log('Final base64 exists:', !!base64String)
    console.log('Final base64 type:', typeof base64String)
    console.log('Final base64 length:', base64String?.length || 0)

    // Convert base64 plot to data URL for display
    let plotUrl = null
    if (base64String && typeof base64String === 'string' && base64String.length > 100) {
      plotUrl = `data:image/png;base64,${base64String}`
      console.log('✅ Created plot data URL successfully, length:', plotUrl.length)
    } else {
      console.error('❌ Could not extract valid base64 string')
      console.log('Result structure:', {
        successType: typeof result.success,
        outputType: typeof result.output,
        plotType: typeof result.plot_base64,
        errorType: typeof result.error
      })
    }

    return NextResponse.json({
      plotUrl,
      output: JSON.stringify(result.output),
      success: true,
      rawResult: result, // For debugging
    })
  } catch (error: any) {
    console.error('Execute API error:', error)
    
    // Provide helpful error messages
    let errorMessage = error.message
    if (error.name === 'AbortError') {
      errorMessage = 'R execution timed out (>30s). Code might be too complex or have infinite loop.'
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Cannot connect to R execution API. Check if Render service is running.'
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

