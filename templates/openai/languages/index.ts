import { rConfig } from './r'
import { pythonConfig } from './python'

// Single source of truth for supported languages
export const SUPPORTED_LANGUAGES = ['r', 'python'] as const
export type Language = typeof SUPPORTED_LANGUAGES[number]

export interface LanguageConfig {
  name: string
  codeField: string
  codeBlockTag: string
  basePrompt: string
  generateFormat: string
  askFormat: string
  codeIndicators: string[]
  defaultCode: string
  monacoLanguage: string
  badgeColor: 'blue' | 'yellow'
  mockCodeTemplate: string
  executionUrlEnvVar: string
}

export function getBadgeClasses(color: string): string {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }
  return colors[color] || colors.blue
}

const languageConfigs: Record<Language, LanguageConfig> = {
  r: rConfig,
  python: pythonConfig,
}

export function getLanguageConfig(language: Language): LanguageConfig {
  return languageConfigs[language]
}
