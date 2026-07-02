# Learnings

> Append-only teaching log. Every "how does this work under the hood?" moment becomes an entry here (per CLAUDE.md §10).
> Never edit past entries - corrections go in a new entry.

---

### Monorepos with npm workspaces

> Why npm workspaces instead of pnpm, Yarn, or Nx?

npm workspaces let a single top-level `package.json` declare a `"workspaces": ["packages/*"]` array, and npm treats each subfolder as its own package while hoisting shared dependencies into the root `node_modules`. There is no extra tool to install - `npm install` at the root wires up cross-package symlinks automatically.

We picked it over pnpm and Yarn because it ships with Node itself, so contributors don't need to install a separate package manager just to build the project. The tradeoff is that npm workspaces are less feature-rich than pnpm (no strict dependency isolation, slower installs on cold caches), but for a two-package repo those don't matter yet.

Concretely, running `npm run build -w packages/cli-node` scopes the build script to that workspace. The `-w` flag is npm's workspace selector - you can also use `--workspaces` to run against all of them.

### Source-of-truth payload with parity checks

> If both CLIs ship the same files, how do we guarantee they never drift?

The naive approach is to duplicate the template files into each package. That works for one release, then someone edits one copy and forgets the other, and the two channels silently diverge - an SRS Risk-row-6 nightmare.

The safer approach, and what Stage 1 shipped, is:

1. Keep exactly one canonical copy at `templates/` in the repo root.
2. Each package's build step (`scripts/build.mjs` for Node, `_build.py` for Python) copies `templates/**` into that package's `_payload/` directory during build.
3. A shared verification script (`tools/check-payload-parity.mjs`) walks both `_payload/` trees, computes a SHA-256 for every file, and diffs the two manifests. Any mismatch in file count, byte size, or content hash fails loudly.

**Why SHA-256 and not just `diff -r`?** Two reasons. First, a hash manifest is a single artifact you can commit to release notes so downstream users can verify the payload themselves. Second, comparing manifests is O(n) in the number of files with constant memory, whereas recursive byte-diffs re-read files. In CI matrix jobs across three OSes, that matters.

The parity script is wired into `tests/parity/parity.test.ts` so `npx vitest run` fails if drift is introduced - the check runs as an ordinary unit test, not a bespoke CI step.

### Python packaging with `uv`

> Why `uv` for the Python CLI instead of `pip` + `setuptools` or `poetry`?

`uv` is a Rust-based Python package manager and build frontend. For our purposes, it gives us three things:

1. A single command (`uv build`) that produces both a wheel and a source distribution from `pyproject.toml` - no separate `setup.py` or build config needed.
2. Fast, deterministic dependency resolution - the `uv.lock` file at `packages/cli-python/` pins the exact resolved tree for reproducible builds.
3. It's free and open source, aligning with the zero-cost constraint in the project's CLAUDE.md §7.

The Python `_build.py` script hooks into the build via `pyproject.toml`'s build hooks, so `uv build` triggers our template-payload copy the same way `npm run build` does on the Node side. Symmetry between the two CLIs is what makes the parity check meaningful.

### Why parity tests need to fail loudly

> What's the failure mode if the parity check is silent or "best effort"?

If the parity check exits 0 on ambiguity - for example, when one payload directory is missing entirely, or when a file exists on one side but not the other - the CI signal is worse than useless. Downstream users install one CLI, get a working project; install the other, get a broken one; and the repo maintainer never sees a red build.

The Stage 1 script explicitly:

- Fails when file counts differ.
- Fails when any file exists in one manifest but not the other.
- Fails when SHA-256 differs for any matching path.
- Prints the offending paths so the operator can see what drifted, not just "parity failed."

This is a small application of the "no silent failures" principle - every branch that could indicate divergence terminates in a non-zero exit and a human-readable message.

### Persona gating with HTML-comment fences

> How do you ship one template file that specializes into four different personas without a templating engine?

The obvious approach is a templating language - Handlebars, Nunjucks, Jinja - and a mustache-like syntax such as `{{#if persona == "student"}}...{{/if}}`. That pulls in a dependency, breaks markdown rendering in every editor between edits, and complicates the round-trip for a user who wants to tweak the template by hand.

Stage 2 takes a simpler route. Persona-gated regions in `templates/CLAUDE.md` are fenced by HTML comments:

```markdown
<!-- persona:student -->

### For the Student

...
<!-- /persona:student -->
```

Markdown renderers ignore HTML comments entirely, so the raw template renders as a valid document in any viewer. The CLI's job at scaffold time is to `.replace(/^<!--\s*persona:([a-z,\s]+)\s*-->[\s\S]*?<!--\s*\/persona:\1\s*-->\n?/gm, ...)` and drop every block whose CSV name list does not contain the chosen persona. The `\1` backreference guarantees the closing fence matches the opening one, so mismatched pairs are left intact and become visible during review rather than silently swallowed.

CSV multi-persona (`persona:student,engineer`) is supported by parsing the captured name group as a comma-separated list and keeping the block when the target persona appears in the list. This lets one block target overlapping personas without duplicating prose.

The tradeoff is expressiveness. HTML-comment fences cannot handle nested conditions, "else" branches, or variable substitution - if any of that is needed later, a real templating layer will have to replace this one. For pre-baked persona guidance, though, "keep or drop a whole block" covers every case Stage 2 needs.

### Counting Anthropic tokens with `js-tiktoken` (cl100k_base)

> The NFR-PERF-02 budget is expressed in tokens. How do you assert it without calling an Anthropic endpoint?

Anthropic does not publish an open tokenizer library the way OpenAI does with `tiktoken`. Calling their API to count tokens would require a network round-trip, an API key, and a paid account - a direct violation of CLAUDE.md §7 (zero-cost) - and would make the test suite flaky.

The workaround is `js-tiktoken`, a pure-JavaScript port of OpenAI's `tiktoken`. Its `cl100k_base` encoding is what GPT-4 and GPT-3.5-turbo use. Anthropic's tokenizer is different in detail (a different byte-pair-encoding vocabulary, slightly different merge rules), but at the granularity a budget check needs - "is this under 8,000 tokens?" - the two agree to within a few percent. That's enough headroom to catch a template that has blown past the budget without producing false alarms on well-scoped content.

Concretely, the check in `tools/count-tokens.mjs` looks like:

```javascript
import { getEncoding } from 'js-tiktoken';
const enc = getEncoding('cl100k_base');
const tokens = enc.encode(text).length;
```

Runs in-process, no network, no key, no cost. When Anthropic ships an open tokenizer, swap the import and re-run the tests. Until then, cl100k_base is the pragmatic proxy.

The lesson generalizes: when the perfect measurement requires a paid dependency, ask whether an approximate measurement that stays within a known error band would still catch the failure mode you care about. For budget assertions with plenty of headroom, the answer is usually yes.

### Hand-rolled argv parsing vs a CLI framework

> When is it worth reaching for commander, yargs, oclif, or clipanion instead of writing your own argv loop?

A CLI framework earns its keep when three things hold at once: many commands (dozens), nested subcommands, and a strong desire for auto-generated help/completions. For a five-command CLI with a flat surface and hand-tuned help text, the framework's own type surface is often larger than the parser it replaces.

`spec-init`'s parser lives in `packages/cli-node/src/args.ts` in about 140 lines. It walks the argv slice with a single `for` loop, matches token-by-token against a fixed set of long-form flags, and pushes anything left over onto a positional list. Unknown flags throw a `UsageError` that the top-level dispatcher catches and prints. The parser has one non-obvious property: it's _typed_ end-to-end. `Persona` and `Integration` are string-literal unions declared once and validated at the parse boundary, so downstream command modules never have to re-check "is this a valid persona?" - the type system already told them yes.

The cost of the DIY approach is real: no completion generation, no automatic manpages, no rich validation like "this flag requires that other flag." For a project the size of `spec-init`, none of those are missed. If the CLI grows to twenty commands or sprouts a plugin API, a framework will pay off and the parser can be swapped out behind the same `CliOptions` interface without touching the command modules.

The general rule: measure the "framework" against the specific work it saves. A tool that saves 300 lines is a win. A tool that costs 30 lines of framework glue to save 40 lines of parsing is a wash - and a wash isn't worth a dependency.

### Three-way text merge for template upgrades

> How do you upgrade a user's project to a newer template version without clobbering their edits?

The naive approach is to overwrite everything on `upgrade`. The user loses their edits and stops trusting the tool. The other naive approach is to never overwrite. Then bug fixes and new content never reach existing projects and every user's tree eventually diverges from the shipped baseline.

Three-way merge threads the needle by comparing three inputs for every file: **BASE** (the payload version the project was originally scaffolded from), **OURS** (what's on disk now, possibly with user edits), and **THEIRS** (the payload version the CLI is trying to install). Four cases fall out:

1. `BASE == THEIRS`: template unchanged in this release; skip the file entirely.
2. `BASE == OURS`: user hasn't touched it; safe to overwrite with THEIRS.
3. `OURS != BASE` and `THEIRS != BASE`, but the edits don't touch the same lines: merge the two independent edit sets, keeping both.
4. Same-line conflicts: emit `<<<<<<< ours` / `======= ` / `>>>>>>> theirs` markers so the user resolves them by hand, exit non-zero.

`spec-init init` snapshots the raw payload into `<project>/.spec-init/base/`. `spec-init upgrade` reads BASE from that snapshot, OURS from the project root, and THEIRS from the CLI's shipped payload. The merge itself is `node-diff3.diff3Merge()` - a well-audited implementation of the classic three-way merge algorithm - with a small wrapper that formats conflicts into git-style markers so the muscle memory transfers.

A subtle but load-bearing detail: after a successful upgrade, the CLI **refreshes** `.spec-init/base/` with THEIRS. That becomes the new common ancestor for the next upgrade. Without the refresh, the next upgrade would keep comparing against the ancient original baseline and misclassify every subsequent template change as a "user edit."

The upside of three-way merge over a diff-and-patch approach: it's symmetric. The template can gain content, lose content, or edit content, and the algorithm handles all three the same way. The downside: it needs the base snapshot to exist. If the user deletes `.spec-init/` - or scaffolded before Stage 3 shipped - the tool has to refuse upgrade rather than guess a baseline. `spec-init doctor` catches this proactively.

### Mirroring a CLI across two runtimes without a shared spec

> When you ship the same tool in two languages, how do you keep them from drifting?

The obvious answer is a shared spec: write the behavior once in some neutral format (JSON schema, protobuf, YAML DSL) and have each language read it. That works when the surface is large - dozens of commands, complex validation rules, cross-cutting concerns - because the cost of maintaining the spec is less than the cost of manually keeping N implementations in sync.

For `spec-init`, the surface is small: five commands, eight flags, one regex, one merge algorithm. Extracting a spec would mean writing a spec-loader in JavaScript and Python that parses the neutral format and configures each CLI. The loaders themselves are code that has to stay in sync. You've moved the drift problem, not solved it.

The alternative - and what Stage 4 took - is **canonical implementation plus parity tests**. Pick one implementation as source of truth (in this case, `tools/strip-personas.mjs` for the persona regex; the JavaScript CLI for the command surface) and write tests that run the other implementation against the same inputs, asserting byte-equivalent output. When a change to one is needed, the test immediately fails until the other is updated.

Two parity tests cover the persona regex: `tests/persona-parity.test.ts` compares the TypeScript port against the `.mjs` source, and `packages/cli-python/tests/test_persona.py` compares the Python port against the same `.mjs`. A third - `tests/cli-parity.test.ts` - scaffolds via both CLIs into two temp dirs and SHA-256s every file. If any of the three fires red, the divergence is caught at test time, not at user report time.

The rule of thumb: **duplicate + test until the duplication cost exceeds the spec-maintenance cost.** Three implementations of a 30-line regex is fine. Ten implementations of a 500-line workflow engine is not.

### `merge3` vs `node-diff3`: normalizing conflict markers across languages

> Two different three-way-merge libraries in two languages - how do you keep the user-facing output identical?

`node-diff3` (Node) and `merge3` (Python) both implement the classic three-way merge algorithm. Their algorithms are equivalent; their **output formats** are not. `node-diff3` returns a sequence of `{ ok: [...lines] }` and `{ conflict: { a: [...ours], b: [...theirs] } }` regions. `merge3` yields tuples like `("unchanged", [...lines])` and `("conflict", base, a, b)`. Neither uses git-style `<<<<<<<` markers natively.

The user-facing contract is what needs to match: whether you install via npm or pip, when you hit a conflict during `spec-init upgrade`, the conflicted file on disk should have the same fence style. Since both libraries expose the merged-region structure, the fix is a small formatter in each language that walks the regions and emits identical fences:

```text
<<<<<<< ours
{our lines}
=======
{their lines}
>>>>>>> theirs
```

Both CLIs' `three-way-merge` modules do exactly this. The library dependency handles the hard part (the diff); the formatter handles the presentation. When we later swap either library for something else, only the formatter has to keep the fences the same - the merge output remains valid to the user.

The general lesson: when depending on cross-runtime libraries with equivalent algorithms but different APIs, keep the depended-on surface narrow. Consume the raw structured output, not the library's pre-formatted string, and produce the user-facing format yourself.

### How Claude Code discovers skills

> Where does Claude Code look for skills, and why does that matter for how Throughspec ships them?

Claude Code auto-discovers skills from two locations at session start: `~/.claude/skills/` (global, all projects) and `<project-root>/.claude/skills/` (project-local). Each skill is a directory whose name is the invocable command (`spec-requirements` → `/spec-requirements`) and whose entry point is a single `SKILL.md` file with YAML frontmatter and a prose body.

The frontmatter carries two required keys:

```yaml
---
name: spec-requirements
description: Build claude/srs.md via structured cross-questioning...
---
```

The `description` field is what Claude Code shows the LLM when deciding whether to invoke the skill. A short, action-triggering description ("Use when the user says X or invokes /Y") gets the skill picked up on the right prompts.

The body of `SKILL.md` is the actual prompt Claude reads when the skill is invoked. Because it is prose, not code, its "behavior" is whatever the LLM does with those instructions. That has one important consequence for shipping skills: **whatever ends up in `.claude/skills/<name>/SKILL.md` inside the user's project IS the skill.** There is no compile step, no manifest to sync, no runtime that could disagree with the file on disk.

For Throughspec that shaped a placement decision. Rather than keeping skills in a separate directory and merging them into the payload at build time, we put them directly under `templates/.claude/skills/`. The existing `spec-init init` copies the templates payload verbatim into the new project, which means the scaffolded project's `.claude/skills/` is populated the moment `init` finishes. Claude Code discovers them on the next session open. No extra wiring, no risk of "the skill file on disk drifted from the packaged version" - the file on disk IS the packaged version.

### Structural testing of LLM prompts

> Skills are prose prompts, not code. How do you test them without running the LLM?

Testing a Claude Code skill by actually invoking Claude with it hits three walls: non-determinism (same prompt, different outputs), cost (each test is a real API call), and slowness (seconds per test, not milliseconds). For a CI suite that runs on every commit, none of that is acceptable.

The workable substitute is **structural testing**: treat the SKILL.md file as a document with a known contract, and grep it for the required elements. If the source SRS says the skill MUST refuse when a category is missing, then the SKILL.md must contain a refusal clause. If the SRS says it must cover five mandatory categories, then the SKILL.md must name all five. The test does not care what Claude will actually say when invoked - it verifies the _instructions Claude will read_ still contain the load-bearing directives.

Throughspec's `tests/skills.test.ts` does exactly this. For each of the three initiation skills, it:

- Parses the YAML frontmatter and asserts the required keys are present and non-trivial.
- Regex-matches the body for each mandatory category name, refusal clause, section heading, and persona annotation.
- Asserts the completion-summary line handing off to the next skill.

If a future editor accidentally deletes the "refuses to proceed" language from `spec-requirements/SKILL.md`, `vitest run` fails immediately. The LLM at runtime would silently accept the change; the structural test catches it before the change ships.

The rule of thumb: **prompts are documents; document contracts are testable statically.** The tests do not prove Claude will behave correctly - nothing short of a running LLM does - but they prove Claude will _see_ the instructions that make correct behavior possible. That is the biggest failure mode a static test can prevent, and it is enough to catch the vast majority of accidental regressions.
