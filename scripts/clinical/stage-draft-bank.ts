import { readFileSync, writeFileSync } from 'node:fs'
import { parseDraftBank, draftImportReport } from '../../src/lib/learning/draft-bank'

const [input, output] = process.argv.slice(2)
if (!input || !output || process.argv.length !== 4) throw new Error('Usage: node --import tsx scripts/clinical/stage-draft-bank.ts input.json report.json (dry-run only)')
const bank = parseDraftBank(JSON.parse(readFileSync(input, 'utf8')))
const report = draftImportReport(bank)
writeFileSync(output, JSON.stringify(report, (key, value) => key === 'questions' ? undefined : value, 2) + '\n')
console.log(JSON.stringify({ questions: report.question_count, families: report.family_count, held: report.held_item_ids.length, publishable: 0, writes_to_database: 0, bank_sha256: report.bank_sha256 }))
