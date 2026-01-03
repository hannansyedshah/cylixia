export const GENERATE_OUTPUT_FORMAT = `

OUTPUT FORMAT (JSON):
Return a valid JSON object with this structure:
{
  "r_code": "# Complete R code here...",
  "explanation": "Brief explanation of what the code does",
  "plot_description": "If visualization is generated, describe what it shows",
  "summary": "A comprehensive summary including: 1) What was created/generated, 2) Key findings or results from the analysis, 3) Any assumptions made, 4) Potential improvements or alternative approaches that could be explored",
  "next_suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}

The r_code field must contain complete, executable R code.
The summary field should provide a detailed overview of the work done, insights gained, and possibilities for further analysis.
Provide 2-4 actionable next suggestions.`
