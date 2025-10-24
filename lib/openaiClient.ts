/**
 * OpenAI Client Configuration
 * Uncomment and configure when ready to use real AI
 */

// import OpenAI from 'openai'

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// })

// export async function generateRCode(prompt: string, systemPrompt: string): Promise<string> {
//   const completion = await openai.chat.completions.create({
//     model: 'gpt-4o',
//     messages: [
//       { role: 'system', content: systemPrompt },
//       { role: 'user', content: prompt }
//     ],
//     temperature: 0.7,
//   })

//   return completion.choices[0].message.content || ''
// }

// Example usage in chat route:
// import { generateRCode } from '@/lib/openaiClient'
// import { routeIntent, getSystemPrompt } from '@/lib/routerLogic'
//
// const routeResult = routeIntent(prompt)
// const systemPrompt = getSystemPrompt(routeResult.route, existingCode)
// const generatedCode = await generateRCode(prompt, systemPrompt)

export const placeholder = true

