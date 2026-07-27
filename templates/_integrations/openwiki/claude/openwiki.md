# openwiki - generated agent documentation

This project opted into [openwiki](https://github.com/langchain-ai/openwiki), a
CLI that automatically generates and maintains an agent-facing documentation
wiki for the codebase. It writes a browsable wiki (with Mermaid diagrams) into an
`openwiki/` directory so agents have structured context to search before doing a
broad grep.

## Install (once, per machine)

openwiki is a globally installed tool, not code checked into this project:

```sh
npm install -g openwiki      # or: pnpm add -g openwiki
```

## Setup and usage

```sh
openwiki --init      # configure your AI provider and API key
openwiki --update    # generate/refresh the wiki in openwiki/
openwiki             # interactive chat over the current repo's wiki
```

Use **code mode** (the default in a repo) so output lands in `openwiki/`.
Credentials live in `~/.openwiki/.env` and reuse a provider you already have
(OpenAI, Anthropic, Gemini, Bedrock) - no new paid service required.

## Two gotchas - read before running

1. **It writes to the repo-root `CLAUDE.md` and `AGENTS.md`.** openwiki injects
   "reference the wiki" prompting into those files. This project's `CLAUDE.md` is
   the behavior contract - **review the diff** after `openwiki --update` and keep
   the contract intact; let openwiki append its wiki-reference note rather than
   overwrite the contract. Commit `CLAUDE.md` before running so any clobber is
   recoverable.
2. **Telemetry is on by default.** Disable it for privacy:
   `OPENWIKI_TELEMETRY_DISABLED=1` (in `~/.openwiki/.env` or your environment).

## How to use it in this project

- **Consult the wiki first.** When searching for how a subsystem works, read the
  relevant `openwiki/` page before grepping the whole repo - it is the
  cheaper, higher-signal path.
- **Keep it fresh.** Regenerate with `openwiki --update` after significant
  changes, or wire the provided CI workflow so the wiki does not drift from the
  code.
- **The wiki is generated, not authoritative.** `claude/srs.md` and the memory
  layer remain the source of truth; treat openwiki pages as a fast index into
  the code, not a replacement for the spec.
