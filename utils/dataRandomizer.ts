import type { ColumnInfo } from '@/types'

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

    const dateValues = values.filter(v => {
      const date = new Date(v)
      return !isNaN(date.getTime()) && v.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/)
    })
    if (dateValues.length === values.length) {
      columns.push({ name: columnName, type: 'date' })
      continue
    }

    const booleanValues = values.filter(v => 
      ['true', 'false', 'yes', 'no', '1', '0', 't', 'f'].includes(v.toLowerCase())
    )
    if (booleanValues.length === values.length) {
      columns.push({ name: columnName, type: 'boolean' })
      continue
    }

    const uniqueValues = [...new Set(values)]
    columns.push({
      name: columnName,
      type: 'text',
      uniqueValues: uniqueValues.length <= 20 ? uniqueValues : undefined
    })
  }

  return columns
}

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
      const words = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta']
      return words[Math.floor(Math.random() * words.length)] + Math.floor(Math.random() * 1000)
    
    default:
      return 'random_value'
  }
}

export function randomizeCSVData(csvData: string): string {
  if (!csvData || csvData.trim() === '') {
    return csvData
  }

  try {
    const lines = csvData.split('\n').filter(line => line.trim())
    if (lines.length < 2) return csvData

    const headers = lines[0]
    const columns = analyzeCSVStructure(csvData)
    
    const dataRows = lines.slice(1)
    const randomizedRows = dataRows.map(() => {
      return columns.map(column => generateRandomValue(column)).join(',')
    })

    return [headers, ...randomizedRows].join('\n')
  } catch (error) {
    console.error('Error randomizing CSV data:', error)
    return csvData
  }
}

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
