# _<Project Name>_

> _<One-line pitch - what the product is and who it's for.>_

Built with the [Spec-Driven Development Claude Project Starter Kit](https://example.com/spec-init).

---

## Status

|                  |                           |
| ---------------- | ------------------------- |
| Stage            | _<from `claude/plan.md`>_ |
| Last shipped     | _<feature name>_          |
| Template version | 1.0.0                     |

---

## Quick Start

```bash
# 1. install dependencies
<command>

# 2. configure env
cp .env.example .env

# 3. run locally
<command>

# 4. run tests
<command>
```

---

## Project Structure

This project follows the **Spec-Driven Development** layout:

```text
.
├── CLAUDE.md              # behavior contract for Claude Code - read first
├── claude/                # durable memory layer
│   ├── srs.md             # frozen requirements
│   ├── plan.md            # staged build plan
│   ├── context.md         # current-state snapshot
│   ├── features.md        # append-only feature log
│   ├── design-decisions.md
│   └── learnings.md       # student-facing learning trail
├── design/                # design system + UI preview assets
└── .github/               # PR + issue templates
```

For the full workflow guide see [the Kit's documentation](https://example.com/spec-init/docs).

---

## Workflow

This project uses a strict Spec-Driven SDLC. Every feature flows through six phases:

1. Requirements → 2. Architecting → 3. Product Specs → 4. Tech Specs → 5. Planning → 6. Writing Code

Invoke any phase via Claude Code:

| Skill                | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `/spec-requirements` | Build or amend `claude/srs.md`            |
| `/spec-design`       | Build or amend `design/design.md`         |
| `/spec-plan`         | Build or amend `claude/plan.md`           |
| `/spec-feature`      | Run the 6-phase feature cycle             |
| `/spec-bug`          | Isolated bug resolution                   |
| `/spec-docs`         | Isolated documentation rewrite            |
| `/spec-sync`         | Reconcile memory files against repo state |

Supporting skills, invoked as needed:

| Skill                | Purpose                                               |
| -------------------- | ----------------------------------------------------- |
| `/spec-architect`    | Design module/service/layer boundaries + ADRs         |
| `/spec-db-design`    | Design and review the database schema                 |
| `/spec-review`       | Multi-axis review (code/pr/frontend/backend/comments) |
| `/spec-code-quality` | Improve code quality and simplify                     |
| `/spec-security`     | Threat-model and harden                               |
| `/spec-performance`  | Measurement-first performance work                    |
| `/spec-test`         | Review test coverage and quality                      |
| `/spec-ux`           | Review usability and accessibility                    |
| `/spec-cicd`         | Review or set up CI/CD quality gates                  |
| `/spec-launch`       | Staged rollout across environments with rollback      |
| `/spec-git`          | Git operations and semantic-version releases          |
| `/spec-brainstorm`   | Generate options with explicit tradeoffs              |
| `/spec-suggest`      | Leverage-ranked improvement suggestions               |
| `/spec-research`     | External knowledge or market research                 |
| `/spec-resume`       | Resume interrupted work from a resumption brief       |

---

## Integrations

<!-- Integration blocks below are inserted or removed by `spec-init init --integrations …` and `spec-init customize --add/--remove <name>`. If no block appears in this section, no integrations are active. -->

<!-- integration:graphify -->

### Graphify

This project is wired for [Graphify](https://graphify.net/) - a code knowledge graph over the codebase. Configuration lives in `.graphify/config.yml`.

<!-- /integration:graphify -->

<!-- integration:obsidian -->

### Obsidian

The `claude/` and `design/` directories form an [Obsidian](https://obsidian.md/) vault. Recommended community plugins:

- **Dataview** - query the features log
- **Graph Analysis** - visualize how decisions link together
- **Excalidraw** - sketch architecture diagrams alongside specs

Open the project folder in Obsidian to navigate the markdown graph visually.

<!-- /integration:obsidian -->

<!-- integration:caveman -->

### Caveman

This project is wired for [Caveman](https://github.com/JuliusBrussee/caveman) - a token-compression skill that makes the agent reply in terse "caveman" prose, cutting output tokens ~65% while keeping code, commands, and errors byte-exact. It also manages the compression mode across a session (`/caveman-stats` reports savings). Install it once (free, local, no account):

```sh
npx skills add JuliusBrussee/caveman
```

See `claude/caveman.md` for modes and usage.

<!-- /integration:caveman -->

<!-- integration:agentmemory -->

### agentmemory

This project is wired for [agentmemory](https://github.com/rohitg00/agentmemory) - persistent memory for AI coding agents that captures decisions and context across sessions and injects them back at session start (local SQLite, no external database). Set it up once:

```sh
npx @agentmemory/agentmemory        # starts the memory server on port 3111
agentmemory connect claude-code     # wires the MCP server into Claude Code
npx skills add rohitg00/agentmemory -y
```

For a zero-cost setup, use local embeddings (`EMBEDDING_PROVIDER=local` in `~/.agentmemory/.env`). See `claude/agentmemory.md`.

<!-- /integration:agentmemory -->

<!-- integration:openwiki -->

### openwiki

This project is wired for [openwiki](https://github.com/langchain-ai/openwiki) - a CLI that generates and maintains an agent-facing documentation wiki for the codebase in an `openwiki/` directory. Install and generate:

```sh
npm install -g openwiki
openwiki --init      # configure your AI provider
openwiki --update    # generate the wiki
```

Note: openwiki also writes prompting into the repo-root `CLAUDE.md`/`AGENTS.md` - review the diff so it does not clobber this project's behavior contract. See `claude/openwiki.md`.

<!-- /integration:openwiki -->

<!-- integration:ponytail -->

### ponytail

This project is wired for [ponytail](https://github.com/DietrichGebert/ponytail) - an AI-agent minimalism ruleset that makes the agent write the least code necessary (YAGNI ladder, shortest working diff) without cutting corners on understanding, validation, or security. Install it in Claude Code as two separate prompts:

```text
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

Adjust intensity with `/ponytail [lite|full|ultra|off]`. See `claude/ponytail.md`.

<!-- /integration:ponytail -->

<!-- integration:opencodereview -->

### Open Code Review

This project is wired for [Open Code Review](https://github.com/alibaba/open-code-review) - an AI-powered code-review CLI (`ocr`) that reviews Git diffs and files with line-level findings (requires Git >= 2.41). Install and configure:

```sh
npm install -g @alibaba-group/open-code-review
ocr config provider   # pick an OpenAI/Anthropic-compatible provider
ocr review            # review staged + unstaged changes
```

Zero-cost path: `ocr delegate preview` reuses your existing coding-agent LLM instead of a separate API key. See `claude/opencodereview.md`.

<!-- /integration:opencodereview -->

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

See [SECURITY.md](./SECURITY.md).

## License

_<choose a license>_
