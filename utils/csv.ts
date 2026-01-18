import Papa from 'papaparse'

export function parseCsv(csvText: string): { headers: string[], rows: string[][] } {
  const result = Papa.parse(csvText, { skipEmptyLines: true })
  if (result.data.length === 0) return { headers: [], rows: [] }
  const [headers, ...rows] = result.data as string[][]
  return { headers, rows }
}
