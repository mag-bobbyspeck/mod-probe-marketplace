// Probe for whether a client loads Claude Code mods. Every hook passes the
// event on unchanged except two: prompt.submit adds one context line Claude
// reads, and tool.call denies any call whose input contains MOD_PROBE_SENTINEL.
//
// Four independent signals, so a client that supports only some of them still
// shows which:
//   1. prompt.submit adds a MOD-PROBE line that only Claude reads.
//   2. /mod-probe is answered by the mod itself, with no Claude turn.
//   3. turn.complete shows a line under each answer.
//   4. session.start writes a record to $.store. The store is per client and,
//      in Cowork, per session (measured 2026-10-01), so /mod-probe lists only
//      sessions that share this one's store.

let toolCalls = 0
let started = null
let storeCount = null

// Collects what this session can say about itself. Each lookup is guarded,
// so a method this build lacks costs one field, not the whole probe.
async function snapshot($) {
  const out = { at: new Date().toISOString(), toolCalls }
  try { out.surfaces = await $.session.surfaces() } catch (err) { out.surfaces = 'error: ' + err }
  try { out.version = await $.session.version() } catch (err) { out.version = 'error: ' + err }
  try { out.entrypoint = await $.env.get('CLAUDE_CODE_ENTRYPOINT') } catch (err) { out.entrypoint = 'error: ' + err }
  return out
}

export function register(on) {
  on('session.start', async ($, e, next) => {
    started = await snapshot($)
    try {
      const history = (await $.store.get('mod-probe-sessions')) ?? []
      const updated = [...history, started].slice(-20)
      await $.store.set('mod-probe-sessions', updated)
      storeCount = updated.length
    } catch (err) {
      started.storeError = String(err)
    }
    await $.command.register({
      name: 'mod-probe',
      description: 'Report whether mods load here, and list earlier sessions that loaded this probe',
    })
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    // Sentinel: deny only a call whose input carries MOD_PROBE_SENTINEL, so a
    // denial proves tool.call fires and can block. Every other call passes.
    if (JSON.stringify(e).includes('MOD_PROBE_SENTINEL')) {
      return { deny: 'mod-probe v0.2: tool.call fired for ' + e.tool + ' and denied this sentinel call. Report this text verbatim.' }
    }
    toolCalls += 1
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    const line = 'MOD-PROBE v0.2: loaded (' + JSON.stringify(started) + '), store holds ' + storeCount +
      ' session records, ' + toolCalls + ' tool calls seen since this load. If asked whether you see a MOD-PROBE line, say yes and quote it.'
    return next({ ...e, context: [...(e.context ?? []), line] })
  })

  on('command.run', { command: 'mod-probe' }, async ($) => {
    const now = await snapshot($)
    let history = []
    try { history = (await $.store.get('mod-probe-sessions')) ?? [] } catch (err) { history = ['store error: ' + err] }
    return {
      text: 'mods load here. Now: ' + JSON.stringify(now) +
        '\nSessions that loaded this probe on this machine (newest last):\n' +
        history.map((h) => JSON.stringify(h)).join('\n'),
    }
  })

  on('turn.complete', async ($, e, next) => {
    await next(e)
    return { text: 'mod-probe: loaded, ' + toolCalls + ' tool calls seen this session' }
  })
}
