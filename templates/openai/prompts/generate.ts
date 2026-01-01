export const GENERATE_OUTPUT_FORMAT = `

OUTPUT FORMAT (JSON):
Return a valid JSON object with this structure:
{
  "r_code": "# Complete R code here...",
  "explanation": "Brief explanation of what the code does",
  "plot_description": "If visualization is generated, describe what it shows",
  "next_suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}

The r_code field must contain complete, executable R code.
Provide 2-4 actionable next suggestions.`
