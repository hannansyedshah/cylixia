import type { LanguageConfig } from './index'

export const pythonConfig: LanguageConfig = {
  name: 'Python',
  codeField: 'python_code',
  codeBlockTag: 'python',
  basePrompt: `You are an expert Python programmer and data scientist specializing in data visualization and analysis.
You generate clean, well-documented, publication-ready Python code following best practices.

IMPORTANT GUIDELINES:
- Use pandas for data manipulation, matplotlib/seaborn for visualization
- Include all necessary import statements at the top of your code
- Generate complete, executable Python code
- Add helpful comments explaining key steps
- Use modern Python idioms and syntax (f-strings, type hints where appropriate)
- Handle edge cases gracefully
- Always call plt.show() after creating matplotlib/seaborn plots`,
  generateFormat: `

OUTPUT FORMAT (JSON):
Return a valid JSON object with this structure:
{
  "python_code": "# Complete Python code here...",
  "explanation": "Brief explanation of what the code does",
  "plot_description": "If visualization is generated, describe what it shows",
  "next_suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}

The python_code field must contain complete, executable Python code.
Provide 2-4 actionable next suggestions.`,
  askFormat: `

MODE: Question Answering
The user is asking a question about their data or code, not requesting new code generation.

OUTPUT FORMAT (JSON):
{
  "explanation": "Detailed answer to the user's question",
  "python_code": "Optional: Python code snippet if helpful (can be empty string)",
  "plot_description": "If discussing visualizations, describe relevant aspects",
  "next_suggestions": ["Follow-up question 1", "Related topic 2"]
}

Focus on clear, educational explanations.
Include code snippets only when they illustrate your answer.`,
  codeIndicators: ['import ', 'def ', 'plt.'],
  defaultCode: '# Your Python code will appear here\n',
  monacoLanguage: 'python',
  badgeColor: 'yellow',
  mockCodeTemplate: `import pandas as pd
import matplotlib.pyplot as plt

# Create your visualization
plt.plot(data['x'], data['y'])
plt.show()`,
  executionUrlEnvVar: 'PYTHON_EXECUTION_URL',
}
