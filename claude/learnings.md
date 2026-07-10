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

### Claude Code sub-agents as tool-scoped actors

> A sub-agent's `tools:` allowlist looks like a hint. Why is it actually a security boundary?

When Claude Code dispatches a sub-agent, it does not just pass the agent's prompt into the model and hope the prose ("do not write files") is honored. The dispatch mechanism itself enforces the `tools:` allowlist declared in the agent's YAML frontmatter. If an agent's frontmatter says `tools: Read`, then even if the prompt inside the agent's `.md` file somehow instructs the model to call `Write`, that tool call is rejected before it reaches the filesystem. The allowlist is a runtime gate, not a suggestion.

That is qualitatively different from a monolithic prompt that says "please don't write files during Phase 2." A monolithic prompt relies on the model's compliance. A tool-scoped sub-agent relies on the harness. When the harness enforces the scope, an adversarial prompt injection inside the agent's inputs cannot escape that scope by convincing the model to break its own rule.

For Throughspec that shaped the six-agent split:

- `spec-interrogator` (`tools: Read`) - cross-questions the user; cannot accidentally scribble on a file.
- `spec-architect` (`tools: Read, Grep, Glob`) - reads the codebase to propose options; cannot edit.
- `spec-coder` (`tools: Read, Write, Edit, Bash`) - the only agent with write authority, and only for implementing one stage at a time.
- `spec-refactorer` (`tools: Read, Edit`) - can modify existing files but not create new ones. Refactor cannot smuggle in a new module.
- `spec-doc-writer` (`tools: Read, Write, Edit`) - updates the memory layer but has no `Bash`, so it cannot run tests or shell commands that would drift the workflow into implementation territory.

The general rule: when a workflow needs distinct capabilities (read-only interrogation vs. write-authorized implementation), do not build one prompt that promises to behave in different modes. Build multiple agents, one per capability profile, and let the harness enforce the boundary.

### Skill-orchestrator + agent-worker split

> Why does `/spec-feature` delegate to six sub-agents instead of doing all six phases itself?

The obvious alternative to Throughspec's design is a monolithic `/spec-feature` skill that walks all six phases in one long prompt. That would be simpler on paper: one file, one place to look.

The problem is that different phases have different failure modes and different tool needs. Phase 1 (Requirements) needs a read-only interrogator that cannot accidentally write code while thinking out loud. Phase 6 (Writing Code) needs full write and bash authority. A monolithic prompt has to declare its tool allowlist as the _union_ of every phase's needs - which means during Phase 1, the same prompt has `Write` and `Bash` available, and the "don't write files during interrogation" instruction is a prose promise, not a harness-enforced boundary.

The split Throughspec chose is:

- **Skill = orchestration + policy.** `/spec-feature` decides what runs when, checks refusal gates (`--skip` requires a `design-decisions.md` entry), and enforces cross-phase invariants (FR-CODE-05 memory update order). It does not need write authority itself; it dispatches to agents that have exactly the authority they need for their phase.
- **Agents = capability-scoped workers.** Each agent has the minimum tool set for its job. Its prompt is short, focused, and impossible to derail into another phase's work because the harness will not let it.

The tradeoff: two-tier design means seven files instead of one. In exchange, every phase's failure mode is bounded by tool scope, and the orchestration policy is separable from the execution details. If someone later swaps the interrogator implementation, the orchestrator stays put; if someone changes the phase order, only the orchestrator moves.

The pattern generalizes: **when a workflow has phases with genuinely different capability requirements, split the "when" from the "how."** The orchestrator owns sequencing and policy; each worker owns its phase's actual work, with the smallest tool set that can accomplish it.

### Reproduction-first bug fixing

> Why does `/spec-bug` refuse to proceed without a reproduction recipe? The user says the bug is real - is that not enough?

The most common failure mode of a bug-fix workflow is not "the fix is wrong." It is "the fix targets a symptom instead of the defect." A user reports "the login button doesn't work"; a well-meaning developer inspects the login handler, finds a plausible-looking issue, edits it, ships, and the button still doesn't work - because the actual defect was in the session middleware two layers deeper, and the plausible-looking issue was benign.

A reproduction recipe forecloses that failure mode. A recipe is:

- The exact command that produces the failure.
- The expected output.
- The actual output.
- The environment.

If the developer cannot reproduce the failure by running the recipe, the "bug" is either misdiagnosed (user error, environment drift, a different codebase) or transient (flakey, dependent on state the recipe does not capture). Either way, editing code before the recipe reproduces is guessing.

Throughspec's `/spec-bug` skill refuses to proceed without a recipe. That refusal drives three downstream guarantees:

- The **failing regression test** exists because the recipe told us what "fails" means. The test IS the recipe, encoded.
- The **smallest possible diff** is enforceable because we can verify the diff changes the recipe's actual output. We do not need to guess whether the fix "works"; we run the recipe again and see.
- The **CHANGELOG.md entry** is precise ("Fixed X in Y" instead of "Fixed something in the login area") because the recipe defines X.

The rule generalizes to any bug-fix workflow: **make reproduction a precondition, not a hope.** If the report cannot be turned into a runnable recipe, the fix cycle should not start. Turning "there's a bug" into "here is the recipe that fails" is where diagnostic value is created; skipping that step trades certainty for velocity, and the trade is almost always bad.

### Isolation-by-audit-log as a compensating control

> Claude Code enforces the `tools:` allowlist at dispatch. Why does `/spec-refactor` also write an audit log?

Sub-agent tool allowlists are a preventive control: they stop scope violations before they happen. `spec-refactorer` cannot Write a new file because Write is not in its allowlist - the harness rejects the tool call at dispatch time.

But there is a subtler failure mode the allowlist does not address: the agent uses only its authorized tools, and still edits files outside the intended scope. `spec-refactorer` has `Read` and `Edit` - both perfectly legitimate - and could nonetheless Edit files that were not on the changed-files list handed to it by `/spec-refactor`. Nothing in the harness watches whether the paths passed to Edit are on the diff-scope list; that check exists only in the skill's prose ("touch only these files").

Prose-level enforcement is a promise. To catch a promise-broken case, you need an audit trail: a record of what the agent actually did, that a reviewer (or a scripted verifier at Stage 10) can compare against what the agent was supposed to do.

`/spec-refactor` writes `.claude/refactor-audits/refactor-audit-{ISO}.md` after every pass, containing:

- The scope handed to `spec-refactorer` (input contract).
- The files `spec-refactorer` reported changing (output claim).
- A verification checklist for a reviewer.

The audit is append-only even on rollback, so the trail cannot be selectively pruned. A drift now becomes observable at PR-review time (or CI-verification time) rather than production time. That is **compensating control** in the classical sense: the harness cannot prevent the failure directly, so the workflow generates the evidence needed to catch it after the fact.

The general rule: **when a control is enforced by convention (prose in a prompt), pair it with an audit that makes the convention observable.** Preventive controls stop the failure; compensating controls surface it. Both matter; either alone leaves a gap.

### Toggleable integrations via HTML-comment marker fences

> Why do the Graphify and Obsidian integrations use `<!-- integration:NAME -->` fences instead of separate template files or a template engine?

The Stage 8 requirement was a "toggle-roundtrip that leaves zero residual files": scaffold, add an integration, remove it, and the tree matches the original scaffold byte-for-byte. Three options existed to encode which content belonged to which integration.

- **Template engine** (Handlebars, Nunjucks, Jinja) - runs at scaffold time, produces different output for different toggles. Every writer (human, LLM) must learn the templating syntax, and there is a new build-time dependency in both the Node and Python packages.
- **Duplicate templates**, one per active-set combination - four permutations for two integrations (none, graphify, obsidian, both). Adding a third integration would grow to eight. Every documentation edit lands in 2⁴ = 16 places for four integrations, and drift is guaranteed within a week.
- **Fenced marker blocks** - HTML comments delimit each integration's content inside the single source-of-truth template. The Stage 2 persona pattern already used this shape (`<!-- persona:NAME -->`) and had proven zero-dep, grep-friendly, and invisible in every markdown viewer.

Stage 8 chose the third. A single `<!-- integration:graphify -->` ... `<!-- /integration:graphify -->` block sits inside the template. At scaffold time, `stripIntegrations(source, active)` walks the source and either drops the block (integration off) or removes only the fence markers and keeps the body (integration on). The template stays readable — a human can see exactly what content each integration contributes because it lives right there, marked but not hidden.

The pattern generalizes: **when a document has variant content, encode the variation inline with delimiters, not by duplicating the document or wrapping it in a templating language.** The delimiters make the variation locally visible; a plain-text file with markers is easier to review, easier to grep, and requires no runtime beyond a regex replacer.

One subtlety: adding an integration post-scaffold requires content the current file no longer has (the marker fences were removed at init). Stage 8 solves this by re-deriving from the `.spec-init/base/` snapshot — the pristine payload that was already being kept for `spec-init upgrade`'s three-way merge. Re-using an existing invariant (the snapshot) was cheaper than inventing new state.

### YAML front-matter that survives markdown formatters

> Prettier reformats standalone `---` into thematic breaks. Markdownlint reads `---` right below a text line as a setext heading. How can a template file carry Obsidian's `---\ntags: [...]\n---` block AND pass both linters?

Obsidian recognizes YAML front-matter only when the file starts with `---` on line 1 (with no leading whitespace or comments). Stage 8 needed the six `claude/*.md` templates plus `design/design.md` to carry front-matter when Obsidian is on and to omit it when Obsidian is off. Both states must lint clean because the template repo asserts `markdownlint` and `prettier --check` on every commit.

Two markdown formatters interpret `---` differently:

- **Prettier** treats a standalone `---` line as a thematic break (`<hr>`). It reformats them by inserting a blank line after, breaking the YAML syntax. Prettier only respects `---` as YAML front-matter when the whole block is at position 0 of the file — inside an HTML-comment-delimited region, it treats them as thematic breaks.
- **Markdownlint** sees a text line followed by `---` on the next line as a setext-style H2 heading (`tags: [srs]` becomes "the heading text," `---` becomes "the setext underline"). MD003 then complains if any subsequent atx heading (`## Foo`) mixes styles, cascading multiple errors.

Stage 8's compromise:

1. **Inner `<!-- prettier-ignore-start -->` / `<!-- prettier-ignore-end -->` fences** wrap the YAML block inside the outer integration marker. Prettier respects these comments and skips reformatting the fenced region entirely.
2. **The strip utility drops the prettier-ignore helper comments** at scaffold time. `stripIntegrations()` runs a post-pass `.replace(/<!--\s*prettier-ignore-(start|end)\s*-->\n?/g, '')` so the helper never appears in the scaffolded output. Combined with the leading-newline trim, this leaves `---` on line 1 where Obsidian expects it.
3. **`MD003` and `MD022` disabled globally** in `.markdownlint.jsonc`. The local alternative — `<!-- markdownlint-disable -->` / `<!-- markdownlint-enable -->` directives around each front-matter block — would require threading their removal through strip too, doubling the escape-comment surface for one rule.

The generalizable lesson: **tools that parse the same characters differently need mediating fences, not workarounds in the content itself.** The template's YAML front-matter is unchanged. The two linters are placated by two separate mechanisms (prettier: ignore comments; markdownlint: config), neither of which pollutes the semantic content. When the strip utility runs, both mechanisms are removed, and what lands on disk is exactly what Obsidian expects: `---\ntags: [srs, throughspec]\n---` on line 1.

An alternative — using TOML front-matter (`+++`) which prettier does not misinterpret — was rejected because Obsidian's TOML support is more restrictive than YAML and third-party tools less consistently recognize it.

### Surgical re-derive: touch only the files whose contract you're changing

> `spec-init customize --add graphify` needs to inject content into files the user may have edited. How does it avoid overwriting Session-History entries in `context.md`?

The tempting default is "regenerate the whole templated tree from the snapshot with the new active set." That is what `--persona` has always done for `CLAUDE.md`: read snapshot, apply strip with new persona, overwrite. Documented, accepted.

Extended naively to `--add`/`--remove`, that policy would rewrite every `.md` file in the templated set — including `claude/context.md`, `claude/features.md`, `claude/learnings.md` — because each one carries an obsidian front-matter marker. If the user has been running `/spec-feature` and appending Session History entries to `context.md` for weeks, `customize --add graphify` would erase all of it. That is not a trade-off worth accepting for a checkbox toggle.

The surgical fix: **scan the snapshot for files that contain the specific marker the current action is toggling, and re-derive only those.** Concretely:

- `--add graphify` / `--remove graphify` → find files whose snapshot content contains `<!-- integration:graphify -->`. That is currently just `CLAUDE.md` and `README.md`. `context.md` carries only `<!-- integration:obsidian -->`, so it is not re-derived.
- `--add obsidian` / `--remove obsidian` → find files with `<!-- integration:obsidian -->`. That includes the six `claude/*.md`, `design/design.md`, and both `CLAUDE.md` / `README.md`. Toggling obsidian *does* replay the memory files (because their front-matter is what makes graph-view work), and the doc clearly notes this trade-off — but toggling graphify leaves the memory files alone.
- `--persona student` → find files with `<!-- persona:` — currently just `CLAUDE.md`. Same as the pre-Stage-8 behavior, unchanged.

The wider principle: **the scope of a change should equal the scope of the contract that changed.** When only the Graphify contract changes, only files that opted into the Graphify contract get replayed. Files that opted into other contracts (obsidian, persona) or into no contract (CHANGELOG.md, plain memory files without markers) are untouched.

Implementing this required nothing new: the snapshot already exists (Stage 3 introduced it for `upgrade`), the markers already exist (Stage 8 added them), and the scan is `snapContent.includes(marker)`. What matters is that the design principle was made explicit — "surgical re-derive by marker match" — instead of defaulting to "replay everything." A one-line change in intent, a thousand user edits preserved.

### Next.js static export as a zero-cost deploy target

> The docs site is Next.js 15, but there is no Node server running it. How does that work, and what do you give up?

A traditional Next.js app runs on a Node server. Every request goes through a `next start` process that decides between rendering a page (React server component), streaming a partial (Suspense), running a Route Handler, or serving a cached static page. That server needs uptime, memory, and cost — which is why the classic Vercel bill grows with traffic.

Setting `output: 'export'` in `next.config.mjs` switches the whole build into a different mode. At `next build` time, every page in `app/` is rendered once into HTML+CSS+JS and written to `out/`. There is no server. There is no `next start`. The `out/` directory is the entire site, and any static host (S3, GitHub Pages, Vercel free tier, a raw nginx) can serve it.

The trade-off is explicit — a small list of features stops working:

- **No Route Handlers, no `revalidatePath`, no on-demand ISR.** All pages are frozen at build time. If your content changes, you rebuild and redeploy.
- **`next/image` optimization is off** (you must set `images: { unoptimized: true }`). Images ship at their source size; you handle sizing yourself.
- **No middleware.** Auth, redirects, rewrites — none of it runs. If you need them, use the host's rewrites or a client-side check.
- **Every route is a folder of `index.html`.** `trailingSlash: true` in the config makes internal links point at `/docs/quickstart/` rather than `/docs/quickstart`, so any static host serves the folder cleanly.

What you keep is significant. Server components still render server-side — they just render at build time, once, and the output is baked into the HTML. That is why the Throughspec docs pages can `import { readFileSync } from 'node:fs'` to parse `../CHANGELOG.md`: the read happens during `next build`, the result becomes part of the static HTML, and the client never touches Node. Client components still hydrate — `Nav`, `AnnounceBar`, `RevealOnScroll`, `PhaseCycler`, and `Search` all work because Next.js still bundles React and serves it as a small runtime.

The rule to remember: **static export means "server code runs at build time, client code runs in the browser, nothing runs in between."** If your feature needs "in between" (per-user data, real-time updates, secrets that shouldn't ship in HTML), static export isn't the right shape. If it doesn't, you pay nothing to serve millions of requests. For a docs site, the trade is trivially worth it — a documentation site is by definition the same for every visitor.

### Porting a pixel-perfect design without inline styles

> The design mocks have `style="…"` on every element. The house rule says no inline CSS. How do you keep the visual output byte-for-byte identical while paying that rule?

There are three tiers of style expression, from most to least Tailwind-friendly:

1. **Values in Tailwind's default scale.** `text-sm`, `bg-white`, `mb-6`, `rounded-xl`. These map to Tailwind's built-in tokens; use them wherever the mock's pixel value happens to match.
2. **Values outside the default scale but expressible.** Tailwind's arbitrary-value syntax (`text-[74px]`, `px-[26px]`, `rounded-[40px]`, `bg-black/20`) accepts any CSS value. The output is still a utility class, still purge-safe, still tree-shakeable — the class name embeds the exact pixel value the mock demands.
3. **Values Tailwind can't reach.** CSS keyframe animations with staggered delays and specific durations aren't expressible as utility classes. Complex gradients with custom stops aren't either. These go into a CSS module (component-scoped) or global CSS (site-wide, e.g. `@keyframes`).

The Throughspec Landing page uses all three tiers. The hero headline is `text-[74px] font-normal leading-[1.08] tracking-tighter2`. The mint glow's gradient is a global CSS rule under `mintGlow` in a `<defs>` block inside the SVG. The cog animation is `.spin32 { animation: spin 3.2s linear infinite; }` in `landing.module.css` — the keyframe `@keyframes spin` lives in `globals.css` and the module class just names a specific instance of it.

Design tokens the mock uses in more than one place go into `tailwind.config.ts`'s `theme.extend`:

```ts
colors: { warm: '#f6f3f1', ink: '#000', muted: '#4e4d4d', dim: '#797776', dark: '#242424', mint: '#a7fccd' }
```

Now `bg-warm`, `text-muted`, `border-ink` are first-class utilities. The design's semantic meaning (warm off-white background, muted secondary text) is encoded in the class name, not just the hex.

A three-tier Tier-2 → Tier-3 escape hatch matters because designers legitimately need pixel-specific values that aren't semantic tokens. Trying to force those into `theme.extend` (`spacing: { '4.5': '18px' }`) bloats the config with one-off keys; trying to write them as inline styles violates the rule. Arbitrary values on utility classes and CSS modules for animation shorthands cover the last mile without polluting either.

The pattern generalizes: **utility classes for anything expressible, scoped CSS for anything Tailwind can't reach, and never inline styles.** The rule holds because it protects two things — a purge-safe production CSS bundle (utility classes) and locally-visible component behavior (CSS modules). Both properties break when JSX starts carrying `style={…}` — the value is invisible to the purger, invisible to a `Cmd+F` across `.css` files, and invisible to component libraries that want to compose your component.

### Static-first search: indexing HTML instead of running a query engine

> Docs sites need search. Every hosted search service — Algolia, Meilisearch, ElasticSearch — costs money or needs a server. How does the site search work if none of them are running?

Traditional site search follows a request-response pattern. A user types a query; the client sends it to a backend; the backend consults an inverted index; the backend returns ranked results. Somebody has to keep that backend running — the vendor charges you for it, or you pay the ops cost to run it yourself.

Pagefind flips the model. **The index becomes part of the static site.** At build time, `pagefind --site out/` walks every `.html` file, tokenizes every visible word, and builds an inverted index sharded into small binary chunks under `out/pagefind/`. Each chunk is a few kilobytes. The chunks are addressed by word prefix — the first three characters of the query determine which chunk to fetch.

At query time, the client:

1. Downloads `/pagefind/pagefind.js` (the runtime, ~30 KB).
2. Takes the user's query, hashes the first few characters, requests the matching chunk from `/pagefind/index/<hash>.pf_index`.
3. Runs the search entirely in the browser against that chunk — ranking, snippet extraction, all client-side.
4. Requests the `fragment` chunk that holds the excerpt HTML for the top results and renders them.

Total network cost for a typical query: one JS file (cached forever), one index chunk (~5–20 KB), one fragment chunk (~5 KB). No backend. No rate limits. No secrets.

The trade-off is that **the index is only accurate as of the last build**. Add a page, ship a build. Change content in a page, ship a build. This matches the static-export model exactly — the whole site rebuilds when content changes, and the search index rides along. If your content changes minute-to-minute (a live blog, a support ticket queue), Pagefind is the wrong tool. If your content is edited-and-shipped (docs, marketing, a blog), it is a perfect fit.

The lazy-load matters for Lighthouse. Pagefind's runtime is ~30 KB gzipped — enough to notice on First Contentful Paint if it loads on every docs page. The Throughspec `Search.tsx` component uses `dynamic import` — the runtime only downloads when the user actually opens the modal (either by clicking or by pressing `⌘K`). Between page load and the first query, the docs page ships zero search JS.

The generalizable rule: **when the content is static, the index can be static too.** Search is not intrinsically a server workload; it becomes one when the content is dynamic. Match the search tier to the content tier — dynamic sites need query engines, static sites need static indexes — and the ops bill collapses.

### Cross-platform CI matrices: fail-fast off, no shared runners, path escapes

> Why is the Throughspec CI matrix designed the way it is, and why does every job re-copy the payload before running tests?

A cross-platform CI matrix is not just "run the same tests on more computers." Every dimension it adds — OS, runtime version, package channel — introduces a distinct failure mode. A well-designed matrix acknowledges that up front.

Three design rules earned from Stage 10:

1. **`fail-fast: false` on every strategy.** GitHub Actions' default is to cancel the whole matrix when one cell fails. That is the wrong default when the goal is discovery. If macOS Node 18 breaks *and* Ubuntu Python 3.11 breaks, cancelling after macOS means the second bug hides until the first is fixed. Multiply by three OSes and multiple runtime versions and you end up debugging one flake per push for a week. Turning fail-fast off costs nothing but a few CI minutes per bad push and delivers a full picture of what is broken.
2. **Payload copies refreshed inside every job that touches them.** The Python CLI ships its template payload as a directory copy alongside its source. Locally, that copy can drift from `templates/`. In CI it can drift when the checkout preserves a symlink or a caching layer serves a stale copy. The workflow avoids all of it by running `rm -rf packages/cli-python/{_payload, src/spec_init/_payload} && cp -R templates …` as the first step of every job that runs parity or pytest. Alternative was "require developers to keep them synced" — rejected because CI failing on stale local checkouts is a footgun the workflow can trivially prevent.
3. **Windows path escapes silently break tools that "should be portable."** `new URL('..', import.meta.url).pathname` returns `/C:/Users/…` on Windows. That is not a valid path for `fs.existsSync` or `child_process.spawn` cwd. `path.resolve(dirname(fileURLToPath(import.meta.url)), '..')` is the canonical fix and required to run `tools/verify-acceptance.mjs` in the `windows-latest` cell. Every cross-platform script needs to be audited for the same class of bug — anywhere a URL is being coerced to a path via string manipulation is a Windows landmine.

Two secondary observations:

- **Cross-runtime jobs deserve their own dimension.** When two runtimes need to agree on an output (Throughspec's Node ↔ Python init parity), running each half of the test in its own matrix cell means one half can pass while the other fails. Instead, dedicate a `cross-lang-parity` job that installs *both* runtimes on one runner and runs the comparison end-to-end. Losing the OS × runtime combinatorics is fine for the comparison — you already covered them in the single-runtime jobs.
- **The final "gate" job depends on the matrix jobs, not the matrix itself.** `acceptance-verify` runs `needs: [node-tests, python-tests, cross-lang-parity]`. That is a single job depending on three matrix groups; GitHub Actions treats "all cells green" as the group succeeding. This gives you a single required-check name to attach to branch protection — you do not have to enumerate 15 matrix cells.

The wider point: **CI is not a rubber stamp; it is the machine that surfaces the failure modes you did not anticipate.** Design it to spend the extra minutes discovering all of them per push, not to fail as fast as possible and hide the rest.

### npm provenance and PyPI trusted publishing: OIDC beats long-lived tokens

> Both publish workflows need registry credentials. Why is OIDC preferred over storing an npm/PyPI token as a repository secret?

Traditional publish flows store a long-lived registry token (`NPM_TOKEN`, `PYPI_TOKEN`) as a repository secret. The workflow reads it, calls `npm publish` or `twine upload`, and moves on. The token has no expiry, has full publish rights to your package, and lives in a place any workflow file in the repo can access. Rotate it and every fork that inherited a copy still has the old value.

OpenID Connect (OIDC) inverts the model. GitHub Actions produces a short-lived JSON Web Token (JWT) attesting to the workflow run: this repo, this workflow file, this commit SHA, this branch, this job. The registry (npm, PyPI) trusts GitHub's OIDC identity provider directly and verifies the JWT against a policy the maintainer configured — "allow publish only from `vishalpatil18/throughspec`, workflow `publish-npm.yml`, on the `main` branch or a `v*` tag". No long-lived token exists. Every publish carries a cryptographically verifiable receipt of what built it.

**npm provenance** goes one step further. With `--provenance` and `id-token: write`, `npm publish` embeds a Sigstore-style attestation into the published tarball's manifest. Consumers can run `npm audit signatures` (or the registry UI can show a "Verified" badge) and see the exact commit SHA that built this artifact. The pre-cursor is not just "someone with the token published this" but "this exact source ran through the CI configuration named in the workflow and produced this exact tarball." Supply-chain attackers who compromise the token no longer win; they would have to compromise the OIDC provider too.

**PyPI's trusted publisher** is the same shape. Configure it once on the PyPI project settings page ("this repo, this workflow, this environment"), and `uv publish` under `id-token: write` reaches back to GitHub for a fresh JWT on every run. The `PYPI_TOKEN` becomes a fallback for pre-configuration bootstrap only.

There is one operational subtlety: **trusted publishing requires the account to prove ownership of the package name first.** First upload of a new project still uses a token (or the PyPI web upload) because the registry needs to establish "this GitHub identity is authorized to publish under this name." From release two onward, the token can be revoked and OIDC takes over. Throughspec's `publish-pypi.yml` keeps the `UV_PUBLISH_TOKEN` env var as a fallback for the same reason.

The generalizable rule: **short-lived, scoped, verifiable credentials beat long-lived tokens for every high-stakes action.** Publishing to a public registry is high-stakes because the artifact goes to millions of downstream installers. Deploy tokens, service accounts, cloud credentials all follow the same pattern once OIDC is available: prefer identity from the runner to secrets on the runner.

### SemVer 0.x → 1.0: the version bump that ends the negotiating window

> Why does bumping from `0.1.0-alpha.0` to `1.0.0` matter beyond the changelog entry, and what does the "alpha" trove classifier actually change?

Under semantic versioning, `0.x.y` is a public statement that anything might change tomorrow. Minor bumps within `0.x` can be breaking. Consumers pin to `~0.1.0` or `==0.1.*` because they cannot trust the next minor. Tools that expect stability (Renovate, Dependabot, `pipx install --python`) treat `0.x` as "hold my hand."

`1.0.0` is the version where the maintainer accepts a constraint: no breaking change in the public API before `2.0.0`. Bumping to 1.0 is not just a marketing move — it is the promise that the shape of `spec-init init`, the location of the memory files, the schema of `CLAUDE.md`, and the semantics of every slash command will not shift out from under someone who wrote automation on top of them. That promise is why 1.0 releases require a spec-first, drift-proof foundation to stand on. Ship it too early and the promise is fiction.

Two consequences at the tool level:

1. **Trove classifiers.** PyPI's `Development Status` classifier is a filter dimension for search and discovery. `3 - Alpha` filters the package out of a lot of tooling queries and warns users at install time. `5 - Production/Stable` opens it up to production users, corporate installer allowlists, and the "Featured" tab. Flipping the classifier without meaning to keep the SemVer promise is a way to burn user trust in a way that no changelog entry recovers.
2. **Distributive stability.** Registry mirrors, corporate proxies, and package caches use the version number to decide what to cache and how long. Yanking a `1.0.0` — even for a genuine bug — is expensive because caches propagate. A pre-1.0 alpha can be yanked, patched, and re-released with fewer downstream headaches; a stable release requires a `1.0.1` and the SemVer contract to hold.

The prep work Throughspec did before flipping the version bit is the whole point of the ten-stage build plan. Every stage produced a "standalone, testable, runnable" deliverable. The 1.0 tag is not "we shipped a lot of features" — it is "we can prove each of these features runs to spec on every platform we support, and we will not break them without cutting a major version." SemVer major bumps exist so users can trust patch and minor bumps. Never flip to 1.0 until the CI matrix that would catch a regression is actually in place.

The generalizable rule: **version numbers are contracts with your users, not decorations on the release notes.** `0.x` says "changing our mind is free." `1.x` says "changing our mind costs a major version." Bump to 1.0 when the machinery that enforces the promise is standing under it — not before, not after.
