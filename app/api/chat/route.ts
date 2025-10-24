import { NextRequest, NextResponse } from 'next/server'
import { routeIntent, getSystemPrompt, type RouteType } from '@/lib/routerLogic'

export async function POST(request: NextRequest) {
  try {
    const { prompt, existingCode } = await request.json()

    // Use router logic to determine intent
    const routeResult = routeIntent(prompt)
    const systemPrompt = getSystemPrompt(routeResult.route, existingCode)

    console.log(`🧠 Route Decision: ${routeResult.route} (${routeResult.confidence} confidence)`)
    console.log(`📝 User prompt: ${prompt.substring(0, 100)}...`)

    // TODO: Integrate with your AI backend (OpenAI, Anthropic, etc.)
    // For now, return a mock response based on route
    let mockCode = ''
    let message = ''

    if (routeResult.route === 'Route 1') {
      // Fixing/modifying existing code
      mockCode = `# Fixed R code based on your request: ${prompt}
library(ggplot2)

# Improved version with better practices
${existingCode || '# Original code here'}

# Applied fixes:
# - Added error handling
# - Improved visualization styling
# - Added comments
`
      message = `I've analyzed and improved your R code based on your request. Here's the updated version:`
    } else {
      // Generating new code
      mockCode = `# Generated R code for: ${prompt}
library(ggplot2)

# Load and prepare data
# data <- read.csv("your_data.csv")

# Create visualization
ggplot(data, aes(x = x_var, y = y_var)) +
  geom_point(color = "#276DC3", size = 3, alpha = 0.7) +
  geom_smooth(method = "lm", color = "#E74C3C") +
  theme_minimal() +
  theme(
    plot.title = element_text(size = 16, face = "bold"),
    axis.title = element_text(size = 12)
  ) +
  labs(
    title = "Data Visualization",
    x = "X Variable",
    y = "Y Variable"
  )
`
      message = `Here's the R code for your request:`
    }

    return NextResponse.json({
      message,
      code: mockCode,
      route: routeResult.route,
      confidence: routeResult.confidence,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}


