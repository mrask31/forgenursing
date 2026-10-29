import { ESLint } from 'eslint'
import { readFileSync } from 'node:fs'
import { relative } from 'node:path'

// Explicit legacy debt, never a blanket rule suppression. New occurrences fail CI.
const baseline = JSON.parse(readFileSync(new URL('./lint-baseline.json', import.meta.url), 'utf8'))
const eligible = new Set(['@typescript-eslint/no-explicit-any', '@typescript-eslint/no-unused-vars', '@typescript-eslint/no-require-imports', '@typescript-eslint/no-empty-object-type', 'react/no-unescaped-entities', 'prefer-const'])
const eslint = new ESLint()
const results = await eslint.lintFiles(['src/**/*.{ts,tsx,js,jsx}'])
let known = 0, failures = 0, warnings = 0
const remaining = new Map(Object.entries(baseline.findings))
for (const result of results) for (const message of result.messages) {
  if (message.severity < 2) { warnings++; continue }
  const file = relative(process.cwd(), result.filePath).replaceAll('\\', '/')
  const key = JSON.stringify([file, message.ruleId, message.message])
  const allowance = remaining.get(key) || 0
  if (eligible.has(message.ruleId) && allowance > 0) {
    remaining.set(key, allowance - 1); known++
  } else {
    console.error(`${file}:${message.line}:${message.column} ${message.ruleId || 'parser'}: ${message.message}`)
    failures++
  }
}
const resolved = [...remaining.values()].reduce((a, b) => a + b, 0)
console.log(`Lint gate: ${failures} new/blocking errors; ${known} documented legacy errors; ${warnings} warnings; ${resolved} baseline entries resolved.`)
console.log('This is an incremental gate, not a clean full-lint claim. Run npm run lint for the complete report.')
process.exitCode = failures ? 1 : 0
