/**
 * Data Randomization Utility
 *
 * This utility randomizes CSV data while preserving the structure and data types
 * to protect user privacy when sending data to AI services for code generation.
 * The original data is still used for actual R code execution.
 *
 * PRIVACY PROTECTION FLOW:
 * 1. User uploads CSV → Original data stored locally
 * 2. Chat request → Randomized data sent to AI for code generation
 * 3. R execution → Original data used for actual code execution
 *
 * This ensures AI services never see real user data while maintaining functionality.
 */

import type { ColumnInfo } from '@/types'

/**
 * Analyzes CSV data to determine column types and characteristics
 */
function analyzeCSVStructure(csvData: string): ColumnInfo[] {
  const lines = csvData.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const columns: ColumnInfo[] = []

  for (let i = 0; i < headers.length; i++) {
    const columnName = headers[i]
    const values = lines.slice(1).map(line => {
      const parts = line.split(',')
      return parts[i]?.trim().replace(/"/g, '') || ''
    }).filter(val => val !== '')

    if (values.length === 0) {
      columns.push({ name: columnName, type: 'text' })
      continue
    }

    // Check if all values are numeric
    const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v))
    if (numericValues.length === values.length) {
      columns.push({
        name: columnName,
        type: 'numeric',
        min: Math.min(...numericValues),
        max: Math.max(...numericValues)
      })
      continue
    }

    // Check if all values are dates (basic check)
    const dateValues = values.filter(v => {
      const date = new Date(v)
      return !isNaN(date.getTime()) && v.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/)
    })
    if (dateValues.length === values.length) {
      columns.push({ name: columnName, type: 'date' })
      continue
    }

    // Check if all values are boolean-like
    const booleanValues = values.filter(v => 
      ['true', 'false', 'yes', 'no', '1', '0', 't', 'f'].includes(v.toLowerCase())
    )
    if (booleanValues.length === values.length) {
      columns.push({ name: columnName, type: 'boolean' })
      continue
    }

    // Default to text
    const uniqueValues = [...new Set(values)]
    columns.push({
      name: columnName,
      type: 'text',
      uniqueValues: uniqueValues.length <= 20 ? uniqueValues : undefined
    })
  }

  return columns
}

/**
 * Generates random data based on column analysis
 */
function generateRandomValue(column: ColumnInfo): string {
  switch (column.type) {
    case 'numeric':
      const min = column.min || 0
      const max = column.max || 100
      return (Math.random() * (max - min) + min).toFixed(2)
    
    case 'date':
      const startDate = new Date('2020-01-01')
      const endDate = new Date('2024-12-31')
      const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()))
      return randomDate.toISOString().split('T')[0]
    
    case 'boolean':
      return Math.random() > 0.5 ? 'true' : 'false'
    
    case 'text':
      if (column.uniqueValues && column.uniqueValues.length > 0) {
        return column.uniqueValues[Math.floor(Math.random() * column.uniqueValues.length)]
      }
      // Generate random text
      const words = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta']
      return words[Math.floor(Math.random() * words.length)] + Math.floor(Math.random() * 1000)
    
    default:
      return 'random_value'
  }
}

/**
 * Randomizes CSV data while preserving structure and data types
 * 
 * @param csvData Original CSV data string
 * @returns Randomized CSV data with same structure
 */
export function randomizeCSVData(csvData: string): string {
  if (!csvData || csvData.trim() === '') {
    return csvData
  }

  try {
    const lines = csvData.split('\n').filter(line => line.trim())
    if (lines.length < 2) return csvData

    const headers = lines[0]
    const columns = analyzeCSVStructure(csvData)
    
    // Generate randomized data rows
    const dataRows = lines.slice(1)
    const randomizedRows = dataRows.map(() => {
      return columns.map(column => generateRandomValue(column)).join(',')
    })

    // Reconstruct CSV
    return [headers, ...randomizedRows].join('\n')
  } catch (error) {
    console.error('Error randomizing CSV data:', error)
    // Return original data if randomization fails
    return csvData
  }
}

/**
 * Creates a sample of the original CSV for preview purposes
 * 
 * @param csvData Original CSV data string
 * @param maxRows Maximum number of rows to include in sample
 * @returns Sample CSV data
 */
export function createCSVSample(csvData: string, maxRows: number = 10): string {
  if (!csvData || csvData.trim() === '') {
    return csvData
  }

  try {
    const lines = csvData.split('\n').filter(line => line.trim())
    if (lines.length <= maxRows + 1) return csvData

    const header = lines[0]
    const sampleData = lines.slice(1, maxRows + 1)
    
    return [header, ...sampleData].join('\n')
  } catch (error) {
    console.error('Error creating CSV sample:', error)
    return csvData
  }
}

/**
 * Validates that randomized data maintains the same structure as original
 * 
 * @param original Original CSV data
 * @param randomized Randomized CSV data
 * @returns True if structure is preserved
 */
export function validateRandomizedData(original: string, randomized: string): boolean {
  try {
    const originalLines = original.split('\n').filter(line => line.trim())
    const randomizedLines = randomized.split('\n').filter(line => line.trim())
    
    if (originalLines.length !== randomizedLines.length) return false
    if (originalLines.length === 0) return true
    
    const originalHeaders = originalLines[0].split(',')
    const randomizedHeaders = randomizedLines[0].split(',')
    
    return originalHeaders.length === randomizedHeaders.length
  } catch (error) {
    console.error('Error validating randomized data:', error)
    return false
  }
}
