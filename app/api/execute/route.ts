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

    console.log('R API Response:', {
      success: result.success,
      hasPlot: !!result.plot_base64,
      error: result.error
    })

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'R execution failed',
        output: result.output || '',
        success: false,
      }, { status: 500 })
    }

    // Convert base64 plot to data URL for display
    let plotUrl = null
    if (result.plot_base64) {
      // Make sure we're getting the string value, not the object
      const base64String = typeof result.plot64 === 'string' 
        ? result.plot_base64 
        : String(result.plot_base64)
      plotUrl = `data:image/png;base64,${base64String}`
      console.log('Created plot URL, length:', plotUrl.length)
    } else {
      console.warn('No plot_base64 in result:', Object.keys(result))
    }

    return NextResponse.json({
      plotUrl,
      output: result.output || '',
      success: true,
      debug: {
        hasPlotBase64: !!result.plot_base64,
        resultKeys: Object.keys(result)
      }
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

