// Reproducible editorial migration from the retained draft-1 export, not publication.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const path = new URL('../../content/drafts/question-bank-v1.json', import.meta.url)
const bank = JSON.parse(readFileSync(path, 'utf8'))
function edit(id, question, options, rationales) {
  const item = bank.questions.find(q => q.id === id)
  Object.assign(item, { question, options, rationales })
}
edit('qb1-d06-v1',
  'A stable client needs an established sterile dressing change. Local policy authorizes competent LPNs, but not UAPs, to perform it. The assigned LPN has not demonstrated this procedure. What should the RN do?',
  { A: 'Arrange for a nurse with verified competence to perform it', B: 'Proceed because the LPN license alone verifies this procedure', C: 'Assign the experienced UAP while the RN observes', D: 'Use verbal instructions instead of verifying competence' },
  { A: 'This assignment requires both authorization and verified procedure-specific competence.', B: 'An authorized role does not establish individual competence for every procedure.', C: 'Direct observation does not override the stated role restriction.', D: 'Instructions alone do not verify the ability to perform this procedure.' })
edit('qb1-p03-v1',
  'A postoperative client has fresh blood rapidly spreading across the dressing and new lightheadedness. Another stable client requests routine discharge instructions. Which need takes priority?',
  { A: 'Immediately assess and escalate the bleeding and new lightheadedness', B: 'Complete discharge instructions before reassessing the dressing', C: 'Record the drainage and wait for the next routine vital-sign check', D: 'Ask the client to rest and report whether symptoms persist' },
  { A: 'Ongoing bleeding with new systemic symptoms raises an urgent circulation concern in this comparison.', B: 'Routine teaching should not delay evaluation of possible deterioration.', C: 'Documentation and a later check do not address the current warning signs.', D: 'Waiting for persistence delays assessment of the bleeding and new lightheadedness.' })
edit('qb2-f18-r1',
  'An adult finds an expired OTC medicine for a nonurgent symptom. The package was stored as directed and the tablets look normal. Which action is appropriate?',
  { A: 'Use it because storage instructions were followed', B: 'Try one dose and judge its strength by symptom relief', C: 'Use it if the package has never been opened', D: 'Replace it with an in-date product if needed and dispose of it safely' },
  { A: 'Correct storage does not extend the labeled expiration date.', B: 'A trial dose does not establish safety or potency.', C: 'An unopened package still has an expiration date.', D: 'Do not use an expired medicine; appearance cannot establish continued safety or effectiveness.' })
edit('qb2-f18-v1',
  'A client finds an unopened OTC medicine past its printed expiration date. The symptom is nonurgent. Which response to the client is appropriate?',
  { A: 'The intact seal extends the printed expiration date', B: 'A normal color is enough to confirm that it remains usable', C: 'Do not use it; obtain an in-date product if needed', D: 'A smaller dose makes an expired product suitable to try' },
  { A: 'The intact seal does not extend the labeled date.', B: 'Color cannot establish safety and effectiveness after expiry.', C: 'FDA advises not using expired medicines, including those that look unchanged.', D: 'Reducing a dose does not resolve uncertainty about an expired product.' })
edit('qb3-g20-r1',
  'A client tracking heart-failure weights usually weighs before breakfast after urinating. Today the client weighs after breakfast in a heavy robe. What should the nurse emphasize for future measurements?',
  { A: 'Average readings taken under different conditions without recording the differences', B: 'Change to evening measurements whenever the morning weight is higher', C: 'Use the same morning routine, scale, location, and similar clothing each day', D: 'Subtract an estimated amount for breakfast and clothing from each reading' },
  { A: 'Inconsistent conditions make the trend harder to interpret.', B: 'Switching times in response to a reading makes comparisons less consistent.', C: 'Consistent conditions improve comparison of daily measurements. Follow the care team’s reporting plan for concerning changes or symptoms.', D: 'Estimated adjustments are not a substitute for consistent measurement conditions.' })
edit('qb1-i05-r1',
  'Using CDC Example 1, a nurse has removed gloves, eye protection, and gown, and cleaned contaminated hands as needed. How should the nurse now remove the surgical mask?',
  { A: 'Pinch the front and pull it away from the face', B: 'Slide it below the chin before releasing the straps', C: 'Fold it against the face while releasing the straps', D: 'Handle the ties or ear loops without touching the front' },
  { A: 'The front is treated as contaminated.', B: 'Sliding the mask under the chin can bring contaminated surfaces against the skin.', C: 'Folding the used front against the face risks self-contamination.', D: 'Use the ties or elastics, avoid the front, discard appropriately, and perform hand hygiene after removal.' })
edit('qb1-i01-v1',
  'While donning a gown and gloves, the nurse notices that the glove openings sit below the gown cuffs, leaving wrist skin exposed. Which adjustment is appropriate?',
  { A: 'Extend the gloves over the gown cuffs', B: 'Roll the gown sleeves farther up the forearms', C: 'Tuck the glove openings inside the gown sleeves', D: 'Leave the gap and rely on hand hygiene after care' },
  { A: 'CDC directs extending gloves over the gown wrists to provide coverage.', B: 'Rolling the sleeves back increases exposed skin.', C: 'The gloves should extend over the gown cuffs.', D: 'Hand hygiene after care does not replace appropriate PPE coverage during care.' })
const renamed = { 'qb1-d02': 'delegation-circumstances-and-change', 'qb1-p01': 'postoperative-stridor-urgent-airway-assessment' }
for (const family of bank.families) {
  if (renamed[family.family_id]) family.distinction = renamed[family.family_id]
  if (['qb1-i01','qb1-i05'].includes(family.family_id)) family.sources = ['https://www.cdc.gov/healthcare-associated-infections/media/pdfs/ppe-sequence-p.pdf']
}
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value
for (const q of bank.questions) {
  const family = bank.families.find(f => f.family_id === q.family_id)
  q.distinction = family.distinction
  q.source_urls = family.sources
  q.content_sha256 = createHash('sha256').update(JSON.stringify(canonical({ question: q.question, options: q.options, answer: q.answer, rationales: q.rationales }))).digest('hex')
}
bank.schema_version = 'draft-2'
bank.revision = 2
bank.hash_algorithm = 'sha256-canonical-json-utf8-v1'
writeFileSync(path, JSON.stringify(bank, null, 2) + '\n')
console.log('Revised seven variants and two family labels; retained draft status and answer positions.')
