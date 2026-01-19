/**
 * User Message Builder for Format Script Generation
 */

export function buildFormatMessage(prompt: string, csvSample: string, fileName: string): string {
  const sections: string[] = []

  sections.push(`TRANSFORMATION REQUEST: ${prompt}`)
  sections.push(`FILE NAME: ${fileName}`)

  // Include CSV sample (first 20 lines or 2000 chars, whichever is less)
  const lines = csvSample.split('\n')
  const sampleLines = lines.slice(0, 20)
  const sample = sampleLines.join('\n')
  const truncated = lines.length > 20 ? `\n...(${lines.length - 20} more rows)` : ''

  sections.push(`CSV SAMPLE (${lines.length} total rows):\n${sample}${truncated}`)

  return sections.join('\n\n')
}
