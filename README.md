# mod-probe-marketplace

A one-plugin marketplace holding `mod-probe`, a throwaway plugin that shows whether a Claude Code
client loads mods and what a mod can do there. It backs ROADMAP P16 in
[magnopus/mcp-tool-guidance-plugin](https://github.com/magnopus/mcp-tool-guidance-plugin), which
has the results so far. The plugin's own README has the signals, the results table and the test
matrix.

## Install, CLI and VS Code

User scope, so both the terminal and the VS Code extension load it:

```
claude plugin marketplace add mag-bobbyspeck/mod-probe-marketplace
claude plugin install mod-probe@mod-probe-marketplace
```

Start a new session (or reload the VS Code window), then ask: "Do you see a MOD-PROBE line?
Quote it in full."

## Install, Cowork

Zip the contents of `mod-probe/` (so `.claude-plugin/` sits at the zip's root), name it
`mod-probe.plugin`, and upload it under Customize, Plugins, +, Add, Upload Plugin.

## Remove it when you're done

It adds a context line to every prompt and denies any tool call whose input contains its
sentinel string, including an edit that only mentions it.

```
claude plugin uninstall mod-probe@mod-probe-marketplace
claude plugin marketplace remove mod-probe-marketplace
```

In Cowork, remove it from Customize, Plugins. Its `$.store` file sits under
`~/.claude/plugins/store/` for the CLI and VS Code.
