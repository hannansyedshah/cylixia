import type { OpenAIMode } from '@/types'
import { BASE_PROMPT, PRIVACY_NOTE_RANDOMIZED, PRIVACY_NOTE_ORIGINAL } from './base'
import { GENERATE_OUTPUT_FORMAT } from './generate'
import { ASK_OUTPUT_FORMAT } from './ask'
import { NIST_ADDENDUM } from './nist'

export { PRIVACY_NOTE_RANDOMIZED, PRIVACY_NOTE_ORIGINAL }

export function getSystemPrompt(mode: OpenAIMode, isNistProject: boolean): string {
  const nist = isNistProject ? NIST_ADDENDUM : ''
  const outputFormat = mode === 'generate' ? GENERATE_OUTPUT_FORMAT : ASK_OUTPUT_FORMAT

  return `${BASE_PROMPT}${nist}${outputFormat}`
}
