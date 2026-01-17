import type { OpenAIMode } from '@/types/openai'
import type { Language } from '../languages'
import { getLanguageConfig } from '../languages'
import { NIST_ADDENDUM } from './nist'

export const PRIVACY_NOTE_RANDOMIZED = '⚠️ NOTE: This CSV data has been RANDOMIZED for privacy protection. Use for structural analysis only.'
export const PRIVACY_NOTE_ORIGINAL = '✓ NOTE: This is ORIGINAL data with real values.'

export function getSystemPrompt(mode: OpenAIMode, isNistProject: boolean, language: Language): string {
  const config = getLanguageConfig(language)
  const nist = isNistProject ? NIST_ADDENDUM : ''
  const outputFormat = mode === 'generate' ? config.generateFormat : config.askFormat

  return `${config.basePrompt}${nist}${outputFormat}`
}
