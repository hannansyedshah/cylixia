import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    // TODO: Integrate with your R execution backend here
    // For now, return a mock plot URL
    const mockPlotUrl = 'https://via.placeholder.com/600x400/276DC3/FFFFFF?text=Generated+Plot'

    return NextResponse.json({
      plotUrl: mockPlotUrl,
      success: true,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to execute code' },
      { status: 500 }
    )
  }
}

