import { NextRequest, NextResponse } from 'next/server'
import { generateContext } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectName, csvFiles } = body

    if (!projectName || !csvFiles) {
      return NextResponse.json(
        { error: 'Missing required fields: projectName and csvFiles' },
        { status: 400 }
      )
    }

    console.log('📝 Generating context for project:', projectName)
    console.log('📂 CSV files:', csvFiles.length)

    const context = await generateContext({
      projectName,
      csvFiles
    })

    return NextResponse.json({ context })
  } catch (error: any) {
    console.error('Context generation API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate context' },
      { status: 500 }
    )
  }
}
