import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    // TODO: Integrate with your AI backend here
    // For now, return a mock response
    const mockCode = `# Generated R code for: ${prompt}
library(ggplot2)

# Sample regression plot
ggplot(data, aes(x = x_var, y = y_var)) +
  geom_point() +
  geom_smooth(method = "lm") +
  theme_minimal() +
  labs(title = "Regression Plot", x = "X Variable", y = "Y Variable")
`

    return NextResponse.json({
      message: 'Here\'s the R code for your request:',
      code: mockCode,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

