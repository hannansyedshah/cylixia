/**
 * OpenAI Context Generation Prompts for NIST Projects
 */

export const CONTEXT_SYSTEM_PROMPT = `You are a research data analyst specializing in NIST-compliant data analysis.
Analyze the provided CSV data and generate a research context template.

OUTPUT FORMAT (plain text, no markdown):
Study Type: [Infer study type - Clinical trial, Observational, Cross-sectional, Longitudinal]

Objective: [Infer main research objective based on data structure]

Dataset Key Fields: [List important column names, comma-separated]

Preferred Analysis Types: [3-5 appropriate analyses - Linear regression, Logistic regression, etc.]

Additional Notes: [Important observations about dataset structure or quality]

Return ONLY the template above with values filled in. No code blocks, no extra formatting.`

export function getDefaultContextTemplate(
  keyFields: string,
  fileNames: string
): string {
  return `Study Type: [To be specified]

Objective: [To be specified]

Dataset Key Fields: ${keyFields}

Dataset Files: ${fileNames || 'No files uploaded'}

Preferred Analysis Types: [To be specified]

Additional Notes: NIST-compliant mode. All PHI fields treated as de-identified tokens.`
}

export function getDefaultContext(csvFiles: Array<{ fileName: string; csvData: string }>): string {
  const fileNames = csvFiles.map(f => f.fileName).join(', ')
  const keyFields = csvFiles[0]?.csvData.split('\n')[0] || 'Not specified'

  return getDefaultContextTemplate(keyFields, fileNames)
}
