export const RESPONSE_MESSAGES = {
  generate: {
    success: 'Here\'s the R code for your request:',
    codeBlock: 'Here\'s the R code:'
  },
  ask: {
    success: 'Here\'s the answer to your question:'
  },
  fallback: ''
} as const

export function getResponseMessage(mode: 'generate' | 'ask', type: 'success' | 'codeBlock' = 'success'): string {
  if (mode === 'ask') {
    return RESPONSE_MESSAGES.ask.success
  }
  return type === 'codeBlock' ? RESPONSE_MESSAGES.generate.codeBlock : RESPONSE_MESSAGES.generate.success
}
