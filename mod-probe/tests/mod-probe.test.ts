import { expect, test } from 'claude-code/testing'

test('/mod-probe answers without a Claude turn and counts tool calls', async ($, on) => {
  on('tool.call', () => ({ result: 'ok' }))
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  const answer = await $.command.run({ command: 'mod-probe', args: '' })
  expect(answer.text).toContain('mods load here')
  expect(answer.text).toContain('"toolCalls":1')
})

test('a sentinel call is denied and others pass', async ($, on) => {
  on('tool.call', () => ({ result: 'ok' }))
  const denied = await $.tool.call({ tool: 'Bash', command: 'echo MOD_PROBE_SENTINEL' })
  expect(JSON.stringify(denied)).toContain('denied this sentinel call')
  const passed = await $.tool.call({ tool: 'Bash', command: 'ls' })
  expect(JSON.stringify(passed)).toContain('ok')
})
