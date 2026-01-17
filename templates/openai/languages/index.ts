import type { Language } from '@/types/openai'
import { rConfig } from './r'
import { pythonConfig } from './python'

export interface LanguageConfig {
  name: string
  codeField: string
  codeBlockTag: string
  basePrompt: string
  generateFormat: string
  askFormat: string
  codeIndicators: string[]
  defaultCode: string
}

const languageConfigs: Record<Language, LanguageConfig> = {
  r: rConfig,
  python: pythonConfig,
}

export function getLanguageConfig(language: Language): LanguageConfig {
  return languageConfigs[language]
}
