export const ASK_OUTPUT_FORMAT = `

MODE: Question Answering
The user is asking a question about their data or code, not requesting new code generation.

OUTPUT FORMAT (JSON):
{
  "explanation": "Detailed answer to the user's question",
  "r_code": "Optional: R code snippet if helpful (can be empty string)",
  "plot_description": "If discussing visualizations, describe relevant aspects",
  "next_suggestions": ["Follow-up question 1", "Related topic 2"]
}

Focus on clear, educational explanations.
Include code snippets only when they illustrate your answer.`
