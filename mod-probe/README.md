# mod-probe

Throwaway plugin that answers one question per client: does it load Claude Code mods?
It adds one line of context after each prompt, which only Claude reads, and denies only a tool
call whose input contains the sentinel string in `hooks/register.js`. Uninstall it when you're
done. Tracked in the guidance plugin's ROADMAP P16.

Mods need Claude Code v2.1.287 or later. Tested offline with `claude plugin validate` and
`claude plugin test` on 2.1.286.

## Signals

| # | Signal | How to read it | Needs the client to draw? |
|---|---|---|---|
| 1 | Context line | Ask: "Do you see a MOD-PROBE line? Quote it." | No |
| 2 | `/mod-probe` | Run it. The mod answers with no Claude turn. | No, but the client must route mod commands |
| 3 | Line under each answer | Look for `mod-probe: loaded, N tool calls seen` | Yes |
| 4 | Shared store | Run `/mod-probe` in a CLI session on the same machine afterwards. It lists every session that loaded the probe, with its `entrypoint` and `surfaces`. | No |

Signal 4 only reads records from the same client: on-computer Cowork and the CLI keep
separate stores (see Results). A record whose session snapshot reads `null` in signal 1 means
`session.start` never fired, which fits the cold-start race CONTRIBUTING describes for
`hooks.json`.

## Results, 2026-10-01

| Client | Loads | Context line | `/mod-probe` | Line under answer | Store | `tool.call` denies |
|---|---|---|---|---|---|---|
| Cowork on your computer, Windows (`local-agent`, 2.1.286) | yes, mid-session | yes | no, "Unknown skill" | no | yes, persists across per-prompt reloads | yes, on an MCP tool |
| Cowork in the cloud (`remote_cowork`, 2.1.287) | yes | yes | no, "Unknown skill" toast | no, `surfaces` empty | 1 record; the mod did **not** reload between prompts | yes, on Bash |
| CLI, Windows (`cli`, 2.1.287) | yes | not checked | **yes**, no Claude turn | not checked | yes, but holds only CLI records | not checked |
| VS Code | not run | | | | | |
| Cowork on your computer, macOS | not run | | | | | |

The mod reloads on each prompt in on-computer Cowork, so module variables reset; only `$.store`
carries state across prompts. **Signal 4 doesn't work across clients:** the CLI's store held
none of the Cowork session's records, so Cowork and the CLI keep separate stores on one machine, and a second Cowork session started
at 1 record, so each Cowork session has its own.
A missing `plugin-authoring` skill says nothing either way: the on-computer session lists none
and loads mods anyway.

v0.2 adds a sentinel check: a tool call whose input contains the sentinel string named in
`hooks/register.js` is denied with the probe's own message, and every other call passes. It
matches any tool's input, so an edit that merely names the string is denied too.

## Matrix

| Client | Install | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| CLI, control | `claude --plugin-dir ./mod-probe`, or the marketplace install | | | | |
| VS Code | The marketplace install in the repo README (user scope, so VS Code gets it too) | | | | |
| Cowork on your computer, Windows | Zip the `mod-probe/` folder as `mod-probe.plugin` and upload it (Customize, Plugins, +, Add, Upload Plugin), in Settings → Cowork turn **Only on this computer** on, then start a new session | | | | |
| Cowork in the cloud | Same upload, turn **Only on this computer** off, then start a new session | | | | n/a, separate container |
| Cowork on your computer, macOS | Same as Windows | | | | |
