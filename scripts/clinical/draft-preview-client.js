/* Standalone editorial preview. No network, clinical approval, or scheduler simulation. */
(() => {
  const data = JSON.parse(document.getElementById('bank-data').textContent)
  const byId = new Map(data.questions.map(q => [q.draft_item_id, q]))
  const key = 'forgenursing-draft-preview:' + data.bank_sha256
  const select = document.getElementById('question-select')
  const form = document.getElementById('answer-form')
  const feedback = document.getElementById('feedback')
  const saveStatus = document.getElementById('save-status')
  let saved = {}
  try {
    const candidate = JSON.parse(localStorage.getItem(key) || '{}')
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      saved = Object.fromEntries(Object.entries(candidate).filter(([id, a]) => byId.has(id) && ['A', 'B', 'C', 'D'].includes(a)))
    }
  } catch { saveStatus.textContent = 'Local saving unavailable. This preview still works for this visit.' }
  function node(tag, text, parent) {
    const el = document.createElement(tag); el.textContent = text; parent.appendChild(el); return el
  }
  for (const q of data.questions) {
    const opt = node('option', q.draft_item_id + ' · ' + q.role.replace('_', ' ') + ' · ' + q.draft_distinction_id.replaceAll('-', ' '), select)
    opt.value = q.draft_item_id
  }
  function showFeedback(q) {
    feedback.replaceChildren()
    const answer = saved[q.draft_item_id]
    if (!answer) return
    node('h2', answer === q.correct_answer ? 'Matches the draft key' : 'Review this choice', feedback)
    node('p', 'Your choice: ' + answer + '. Draft key: ' + q.correct_answer + '. This is editorial QA, not clinical validation.', feedback)
    for (const option of q.options) node('p', option.label + '. ' + (option.label === q.correct_answer ? q.rationale_correct : q.rationale_incorrect[option.label]), feedback)
    node('h3', 'Sources supplied with this draft', feedback)
    const list = node('ul', '', feedback)
    for (const url of q.source_urls) {
      const a = node('a', url, node('li', '', list)); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'
    }
  }
  function render() {
    const q = byId.get(select.value)
    form.replaceChildren()
    const fieldset = node('fieldset', '', form)
    node('legend', q.question_stem, fieldset)
    for (const option of q.options) {
      const label = node('label', '', fieldset)
      const input = document.createElement('input')
      input.type = 'radio'; input.name = 'answer'; input.value = option.label
      input.checked = saved[q.draft_item_id] === option.label
      input.disabled = !!saved[q.draft_item_id]
      label.appendChild(input); node('span', option.label + '. ' + option.text, label)
    }
    const button = node('button', saved[q.draft_item_id] ? 'Response saved in this preview' : 'Check against draft key', form)
    button.type = 'submit'; button.disabled = true
    form.onchange = () => { button.disabled = !form.querySelector('input:checked') || !!saved[q.draft_item_id] }
    node('p', saved[q.draft_item_id] ? 'Previously answered here — this is not a fresh question.' : 'Not yet answered in this preview.', form)
    showFeedback(q)
    const stats = document.getElementById('scores'); stats.replaceChildren()
    for (const role of ['original', 'retry', 'delayed_review']) {
      const answered = data.questions.filter(item => item.role === role && saved[item.draft_item_id])
      const correct = answered.filter(item => saved[item.draft_item_id] === item.correct_answer).length
      node('p', role.replace('_', ' ') + ': ' + correct + '/' + answered.length + ' matches draft keys', stats)
    }
  }
  form.onsubmit = event => {
    event.preventDefault()
    const q = byId.get(select.value), checked = form.querySelector('input:checked')
    if (!checked || saved[q.draft_item_id]) return
    saved[q.draft_item_id] = checked.value
    try { localStorage.setItem(key, JSON.stringify(saved)); saveStatus.textContent = 'QA responses saved in this browser only.' }
    catch { saveStatus.textContent = 'Response retained for this visit; local saving unavailable.' }
    render()
  }
  select.onchange = render
  document.getElementById('reset').onclick = () => {
    saved = {}
    try { localStorage.removeItem(key) } catch { /* Memory remains usable. */ }
    saveStatus.textContent = 'Preview responses cleared.'; render()
  }
  render()
})()
