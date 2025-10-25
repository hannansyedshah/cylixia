/**
 * Router Logic - Determines if user wants to fix existing code or generate new code
 */

export type RouteType = 'Route 1' | 'Route 2'

export interface RouteResult {
  route: RouteType
  confidence: 'high' | 'medium' | 'low'
}

export function routeIntent(userInput: string): RouteResult {
  const text = userInput.toLowerCase()

  const fixKeywords = [
    'fix', 'correct', 'repair', 'resolve', 'debug', 'adjust', 'update',
    'modify', 'change', 'revise', 'edit', 'improve', 'enhance', 'rewrite',
    'refactor', 'rework', 'optimize', 'simplify', 'patch', 'troubleshoot',
    'restore', 'tweak', 'adjust this', 'edit this', 'revamp',
    'make this better', 'make it work', 'error', 'bug', 'problem',
    'issue', 'wrong', 'broken', 'crash', 'please fix', 'use same code',
    'based on previous', 'keep the same', 'continue this'
  ]

  const newKeywords = [
    'create', 'generate', 'make', 'write', 'produce', 'build', 'draw',
    'construct', 'visualize', 'show', 'display', 'render', 'plot', 'graph',
    'chart', 'scatterplot', 'boxplot', 'histogram', 'barplot', 'line plot',
    'anova', 'linear regression', 'correlation', 'heatmap', 'summary',
    'describe', 'analyze', 'model', 'new visualization', 'create model',
    'run analysis', 'make graph', 'build plot', 'start over', 'begin again'
  ]

  const contextKeywords = ['previous', 'same', 'again', 'above', 'earlier', 'that code', 'this code']

  // Count matches
  const fixMatches = fixKeywords.filter(k => text.includes(k)).length
  const newMatches = newKeywords.filter(k => text.includes(k)).length
  const contextMatches = contextKeywords.filter(k => text.includes(k)).length

  // Route 1: Fix existing code
  if (fixMatches > 0 || contextMatches > 0) {
    const confidence = fixMatches >= 2 || contextMatches >= 2 ? 'high' : 
                      fixMatches >= 1 || contextMatches >= 1 ? 'medium' : 'low'
    return { route: 'Route 1', confidence }
  }

  // Route 2: Generate new code (default)
  if (newMatches > 0) {
    const confidence = newMatches >= 2 ? 'high' : newMatches >= 1 ? 'medium' : 'low'
    return { route: 'Route 2', confidence }
  }

  // Default to Route 2 if ambiguous
  return { route: 'Route 2', confidence: 'low' }
}

export function getSystemPrompt(route: RouteType, existingCode?: string): string {
  if (route === 'Route 1') {
    // Fix/modify existing code
    return `You are an expert R programming assistant specializing in debugging and improving existing R code.

Your task is to:
- Analyze the existing R code provided
- Fix any errors or issues, especially syntax errors
- Improve code efficiency and readability
- Maintain the original intent while making it better
- Ensure proper R syntax for factor(), ggplot2, and other functions
- Fix common issues like missing parentheses, incorrect function calls, and data type mismatches

${existingCode ? `Here is the existing code:\n\`\`\`r\n${existingCode}\n\`\`\`` : ''}

Always return valid, executable R code with clear comments.
Use ggplot2 for visualizations when appropriate.
Focus on making the code work correctly and efficiently.
Pay special attention to factor() function syntax: factor(variable, levels = c("level1", "level2", "level3"))
When using dplyr functions like mutate(), filter(), select(), ensure they are called on data frames, not functions.
Use proper dplyr syntax: data %>% mutate(new_col = ...) or mutate(data, new_col = ...)
Avoid conflicts between dplyr and base R functions by using explicit namespacing when needed.
Always use <- for assignment, never = for variable assignment.
Handle NULL values properly: variable <- NULL (not variable = NULL).
Be careful with ellipsis (...) in function arguments - use proper syntax.
Ensure proper spacing around assignment operators: variable <- value (not variable<-value).
Use consistent variable naming: avoid typos like 'to_insta' (use 'to_install' instead).
Always define variables before using them.
Use meaningful variable names that are easy to understand and spell correctly.

CRITICAL REQUIREMENTS:
- NEVER use single letter variables like 'l', 'p', 'g' unless they are standard R conventions (i, j, k for loops)
- ALWAYS define variables before using them
- ALWAYS use meaningful variable names (e.g., 'plot_obj' instead of 'p', 'data_length' instead of 'l')
- ALWAYS include proper library() calls at the beginning
- ALWAYS test that variables exist before using them
- NEVER use undefined variables like 'to_insta', 'l', 'p', 'g' etc.

EXAMPLE OF GOOD R CODE:
library(ggplot2)
library(dplyr)

# Define variables clearly
plot_object <- ggplot(data, aes(x = variable1, y = variable2)) +
  geom_boxplot()

# Always check data exists
if (exists("data") && nrow(data) > 0) {
  print(plot_object)
}`
  } else {
    // Generate new code
    return `You are an expert R programming assistant specializing in data visualization and statistical analysis.

Your task is to:
- Generate clean, professional R code based on user requests
- Use ggplot2 for all visualizations
- Include proper data handling and error checking
- Add helpful comments explaining the code
- Use modern R best practices
- Ensure correct syntax for all R functions
- Use proper factor() syntax: factor(variable, levels = c("level1", "level2", "level3"))
- Handle CSV data properly with read.csv() and appropriate data types

Always return complete, executable R code.
Make visualizations clear, professional, and publication-ready.
Use meaningful variable names and follow R style guidelines.
Include library() calls for required packages at the beginning.
When using dplyr functions like mutate(), filter(), select(), ensure they are called on data frames, not functions.
Use proper dplyr syntax: data %>% mutate(new_col = ...) or mutate(data, new_col = ...)
Avoid conflicts between dplyr and base R functions by using explicit namespacing when needed.
Always use <- for assignment, never = for variable assignment.
Handle NULL values properly: variable <- NULL (not variable = NULL).
Be careful with ellipsis (...) in function arguments - use proper syntax.
Ensure proper spacing around assignment operators: variable <- value (not variable<-value).
Use consistent variable naming: avoid typos like 'to_insta' (use 'to_install' instead).
Always define variables before using them.
Use meaningful variable names that are easy to understand and spell correctly.

CRITICAL REQUIREMENTS:
- NEVER use single letter variables like 'l', 'p', 'g' unless they are standard R conventions (i, j, k for loops)
- ALWAYS define variables before using them
- ALWAYS use meaningful variable names (e.g., 'plot_obj' instead of 'p', 'data_length' instead of 'l')
- ALWAYS include proper library() calls at the beginning
- ALWAYS test that variables exist before using them
- NEVER use undefined variables like 'to_insta', 'l', 'p', 'g' etc.

EXAMPLE OF GOOD R CODE:
library(ggplot2)
library(dplyr)

# Define variables clearly
plot_object <- ggplot(data, aes(x = variable1, y = variable2)) +
  geom_boxplot()

# Always check data exists
if (exists("data") && nrow(data) > 0) {
  print(plot_object)
}`
  }
}

