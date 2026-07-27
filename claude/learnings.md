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

Stage 8 chose the third. A single `<!-- integration:graphify -->` ... `<!-- /integration:graphify -->` block sits inside the template. At scaffold time, `stripIntegrations(source, active)` walks the source and either drops the block (integration off) or removes only the fence markers and keeps the body (integration on). The template stays readable - a human can see exactly what content each integration contributes because it lives right there, marked but not hidden.

The pattern generalizes: **when a document has variant content, encode the variation inline with delimiters, not by duplicating the document or wrapping it in a templating language.** The delimiters make the variation locally visible; a plain-text file with markers is easier to review, easier to grep, and requires no runtime beyond a regex replacer.

One subtlety: adding an integration post-scaffold requires content the current file no longer has (the marker fences were removed at init). Stage 8 solves this by re-deriving from the `.spec-init/base/` snapshot - the pristine payload that was already being kept for `spec-init upgrade`'s three-way merge. Re-using an existing invariant (the snapshot) was cheaper than inventing new state.

### YAML front-matter that survives markdown formatters

> Prettier reformats standalone `---` into thematic breaks. Markdownlint reads `---` right below a text line as a setext heading. How can a template file carry Obsidian's `---\ntags: [...]\n---` block AND pass both linters?

Obsidian recognizes YAML front-matter only when the file starts with `---` on line 1 (with no leading whitespace or comments). Stage 8 needed the six `claude/*.md` templates plus `design/design.md` to carry front-matter when Obsidian is on and to omit it when Obsidian is off. Both states must lint clean because the template repo asserts `markdownlint` and `prettier --check` on every commit.

Two markdown formatters interpret `---` differently:

- **Prettier** treats a standalone `---` line as a thematic break (`<hr>`). It reformats them by inserting a blank line after, breaking the YAML syntax. Prettier only respects `---` as YAML front-matter when the whole block is at position 0 of the file - inside an HTML-comment-delimited region, it treats them as thematic breaks.
- **Markdownlint** sees a text line followed by `---` on the next line as a setext-style H2 heading (`tags: [srs]` becomes "the heading text," `---` becomes "the setext underline"). MD003 then complains if any subsequent atx heading (`## Foo`) mixes styles, cascading multiple errors.

Stage 8's compromise:

1. **Inner `<!-- prettier-ignore-start -->` / `<!-- prettier-ignore-end -->` fences** wrap the YAML block inside the outer integration marker. Prettier respects these comments and skips reformatting the fenced region entirely.
2. **The strip utility drops the prettier-ignore helper comments** at scaffold time. `stripIntegrations()` runs a post-pass `.replace(/<!--\s*prettier-ignore-(start|end)\s*-->\n?/g, '')` so the helper never appears in the scaffolded output. Combined with the leading-newline trim, this leaves `---` on line 1 where Obsidian expects it.
3. **`MD003` and `MD022` disabled globally** in `.markdownlint.jsonc`. The local alternative - `<!-- markdownlint-disable -->` / `<!-- markdownlint-enable -->` directives around each front-matter block - would require threading their removal through strip too, doubling the escape-comment surface for one rule.

The generalizable lesson: **tools that parse the same characters differently need mediating fences, not workarounds in the content itself.** The template's YAML front-matter is unchanged. The two linters are placated by two separate mechanisms (prettier: ignore comments; markdownlint: config), neither of which pollutes the semantic content. When the strip utility runs, both mechanisms are removed, and what lands on disk is exactly what Obsidian expects: `---\ntags: [srs, throughspec]\n---` on line 1.

An alternative - using TOML front-matter (`+++`) which prettier does not misinterpret - was rejected because Obsidian's TOML support is more restrictive than YAML and third-party tools less consistently recognize it.

### Surgical re-derive: touch only the files whose contract you're changing

> `spec-init customize --add graphify` needs to inject content into files the user may have edited. How does it avoid overwriting Session-History entries in `context.md`?

The tempting default is "regenerate the whole templated tree from the snapshot with the new active set." That is what `--persona` has always done for `CLAUDE.md`: read snapshot, apply strip with new persona, overwrite. Documented, accepted.

Extended naively to `--add`/`--remove`, that policy would rewrite every `.md` file in the templated set - including `claude/context.md`, `claude/features.md`, `claude/learnings.md` - because each one carries an obsidian front-matter marker. If the user has been running `/spec-feature` and appending Session History entries to `context.md` for weeks, `customize --add graphify` would erase all of it. That is not a trade-off worth accepting for a checkbox toggle.

The surgical fix: **scan the snapshot for files that contain the specific marker the current action is toggling, and re-derive only those.** Concretely:

- `--add graphify` / `--remove graphify` → find files whose snapshot content contains `<!-- integration:graphify -->`. That is currently just `CLAUDE.md` and `README.md`. `context.md` carries only `<!-- integration:obsidian -->`, so it is not re-derived.
- `--add obsidian` / `--remove obsidian` → find files with `<!-- integration:obsidian -->`. That includes the six `claude/*.md`, `design/design.md`, and both `CLAUDE.md` / `README.md`. Toggling obsidian _does_ replay the memory files (because their front-matter is what makes graph-view work), and the doc clearly notes this trade-off - but toggling graphify leaves the memory files alone.
- `--persona student` → find files with `<!-- persona:` - currently just `CLAUDE.md`. Same as the pre-Stage-8 behavior, unchanged.

The wider principle: **the scope of a change should equal the scope of the contract that changed.** When only the Graphify contract changes, only files that opted into the Graphify contract get replayed. Files that opted into other contracts (obsidian, persona) or into no contract (CHANGELOG.md, plain memory files without markers) are untouched.

Implementing this required nothing new: the snapshot already exists (Stage 3 introduced it for `upgrade`), the markers already exist (Stage 8 added them), and the scan is `snapContent.includes(marker)`. What matters is that the design principle was made explicit - "surgical re-derive by marker match" - instead of defaulting to "replay everything." A one-line change in intent, a thousand user edits preserved.

### Next.js static export as a zero-cost deploy target

> The docs site is Next.js 15, but there is no Node server running it. How does that work, and what do you give up?

A traditional Next.js app runs on a Node server. Every request goes through a `next start` process that decides between rendering a page (React server component), streaming a partial (Suspense), running a Route Handler, or serving a cached static page. That server needs uptime, memory, and cost - which is why the classic Vercel bill grows with traffic.

Setting `output: 'export'` in `next.config.mjs` switches the whole build into a different mode. At `next build` time, every page in `app/` is rendered once into HTML+CSS+JS and written to `out/`. There is no server. There is no `next start`. The `out/` directory is the entire site, and any static host (S3, GitHub Pages, Vercel free tier, a raw nginx) can serve it.

The trade-off is explicit - a small list of features stops working:

- **No Route Handlers, no `revalidatePath`, no on-demand ISR.** All pages are frozen at build time. If your content changes, you rebuild and redeploy.
- **`next/image` optimization is off** (you must set `images: { unoptimized: true }`). Images ship at their source size; you handle sizing yourself.
- **No middleware.** Auth, redirects, rewrites - none of it runs. If you need them, use the host's rewrites or a client-side check.
- **Every route is a folder of `index.html`.** `trailingSlash: true` in the config makes internal links point at `/docs/quickstart/` rather than `/docs/quickstart`, so any static host serves the folder cleanly.

What you keep is significant. Server components still render server-side - they just render at build time, once, and the output is baked into the HTML. That is why the Throughspec docs pages can `import { readFileSync } from 'node:fs'` to parse `../CHANGELOG.md`: the read happens during `next build`, the result becomes part of the static HTML, and the client never touches Node. Client components still hydrate - `Nav`, `AnnounceBar`, `RevealOnScroll`, `PhaseCycler`, and `Search` all work because Next.js still bundles React and serves it as a small runtime.

The rule to remember: **static export means "server code runs at build time, client code runs in the browser, nothing runs in between."** If your feature needs "in between" (per-user data, real-time updates, secrets that shouldn't ship in HTML), static export isn't the right shape. If it doesn't, you pay nothing to serve millions of requests. For a docs site, the trade is trivially worth it - a documentation site is by definition the same for every visitor.

### Porting a pixel-perfect design without inline styles

> The design mocks have `style="…"` on every element. The house rule says no inline CSS. How do you keep the visual output byte-for-byte identical while paying that rule?

There are three tiers of style expression, from most to least Tailwind-friendly:

1. **Values in Tailwind's default scale.** `text-sm`, `bg-white`, `mb-6`, `rounded-xl`. These map to Tailwind's built-in tokens; use them wherever the mock's pixel value happens to match.
2. **Values outside the default scale but expressible.** Tailwind's arbitrary-value syntax (`text-[74px]`, `px-[26px]`, `rounded-[40px]`, `bg-black/20`) accepts any CSS value. The output is still a utility class, still purge-safe, still tree-shakeable - the class name embeds the exact pixel value the mock demands.
3. **Values Tailwind can't reach.** CSS keyframe animations with staggered delays and specific durations aren't expressible as utility classes. Complex gradients with custom stops aren't either. These go into a CSS module (component-scoped) or global CSS (site-wide, e.g. `@keyframes`).

The Throughspec Landing page uses all three tiers. The hero headline is `text-[74px] font-normal leading-[1.08] tracking-tighter2`. The mint glow's gradient is a global CSS rule under `mintGlow` in a `<defs>` block inside the SVG. The cog animation is `.spin32 { animation: spin 3.2s linear infinite; }` in `landing.module.css` - the keyframe `@keyframes spin` lives in `globals.css` and the module class just names a specific instance of it.

Design tokens the mock uses in more than one place go into `tailwind.config.ts`'s `theme.extend`:

```ts
colors: { warm: '#f6f3f1', ink: '#000', muted: '#4e4d4d', dim: '#797776', dark: '#242424', mint: '#a7fccd' }
```

Now `bg-warm`, `text-muted`, `border-ink` are first-class utilities. The design's semantic meaning (warm off-white background, muted secondary text) is encoded in the class name, not just the hex.

A three-tier Tier-2 → Tier-3 escape hatch matters because designers legitimately need pixel-specific values that aren't semantic tokens. Trying to force those into `theme.extend` (`spacing: { '4.5': '18px' }`) bloats the config with one-off keys; trying to write them as inline styles violates the rule. Arbitrary values on utility classes and CSS modules for animation shorthands cover the last mile without polluting either.

The pattern generalizes: **utility classes for anything expressible, scoped CSS for anything Tailwind can't reach, and never inline styles.** The rule holds because it protects two things - a purge-safe production CSS bundle (utility classes) and locally-visible component behavior (CSS modules). Both properties break when JSX starts carrying `style={…}` - the value is invisible to the purger, invisible to a `Cmd+F` across `.css` files, and invisible to component libraries that want to compose your component.

### Static-first search: indexing HTML instead of running a query engine

> Docs sites need search. Every hosted search service - Algolia, Meilisearch, ElasticSearch - costs money or needs a server. How does the site search work if none of them are running?

Traditional site search follows a request-response pattern. A user types a query; the client sends it to a backend; the backend consults an inverted index; the backend returns ranked results. Somebody has to keep that backend running - the vendor charges you for it, or you pay the ops cost to run it yourself.

Pagefind flips the model. **The index becomes part of the static site.** At build time, `pagefind --site out/` walks every `.html` file, tokenizes every visible word, and builds an inverted index sharded into small binary chunks under `out/pagefind/`. Each chunk is a few kilobytes. The chunks are addressed by word prefix - the first three characters of the query determine which chunk to fetch.

At query time, the client:

1. Downloads `/pagefind/pagefind.js` (the runtime, ~30 KB).
2. Takes the user's query, hashes the first few characters, requests the matching chunk from `/pagefind/index/<hash>.pf_index`.
3. Runs the search entirely in the browser against that chunk - ranking, snippet extraction, all client-side.
4. Requests the `fragment` chunk that holds the excerpt HTML for the top results and renders them.

Total network cost for a typical query: one JS file (cached forever), one index chunk (~5–20 KB), one fragment chunk (~5 KB). No backend. No rate limits. No secrets.

The trade-off is that **the index is only accurate as of the last build**. Add a page, ship a build. Change content in a page, ship a build. This matches the static-export model exactly - the whole site rebuilds when content changes, and the search index rides along. If your content changes minute-to-minute (a live blog, a support ticket queue), Pagefind is the wrong tool. If your content is edited-and-shipped (docs, marketing, a blog), it is a perfect fit.

The lazy-load matters for Lighthouse. Pagefind's runtime is ~30 KB gzipped - enough to notice on First Contentful Paint if it loads on every docs page. The Throughspec `Search.tsx` component uses `dynamic import` - the runtime only downloads when the user actually opens the modal (either by clicking or by pressing `⌘K`). Between page load and the first query, the docs page ships zero search JS.

The generalizable rule: **when the content is static, the index can be static too.** Search is not intrinsically a server workload; it becomes one when the content is dynamic. Match the search tier to the content tier - dynamic sites need query engines, static sites need static indexes - and the ops bill collapses.

### Cross-platform CI matrices: fail-fast off, no shared runners, path escapes

> Why is the Throughspec CI matrix designed the way it is, and why does every job re-copy the payload before running tests?

A cross-platform CI matrix is not just "run the same tests on more computers." Every dimension it adds - OS, runtime version, package channel - introduces a distinct failure mode. A well-designed matrix acknowledges that up front.

Three design rules earned from Stage 10:

1. **`fail-fast: false` on every strategy.** GitHub Actions' default is to cancel the whole matrix when one cell fails. That is the wrong default when the goal is discovery. If macOS Node 18 breaks _and_ Ubuntu Python 3.11 breaks, cancelling after macOS means the second bug hides until the first is fixed. Multiply by three OSes and multiple runtime versions and you end up debugging one flake per push for a week. Turning fail-fast off costs nothing but a few CI minutes per bad push and delivers a full picture of what is broken.
2. **Payload copies refreshed inside every job that touches them.** The Python CLI ships its template payload as a directory copy alongside its source. Locally, that copy can drift from `templates/`. In CI it can drift when the checkout preserves a symlink or a caching layer serves a stale copy. The workflow avoids all of it by running `rm -rf packages/cli-python/{_payload, src/spec_init/_payload} && cp -R templates …` as the first step of every job that runs parity or pytest. Alternative was "require developers to keep them synced" - rejected because CI failing on stale local checkouts is a footgun the workflow can trivially prevent.
3. **Windows path escapes silently break tools that "should be portable."** `new URL('..', import.meta.url).pathname` returns `/C:/Users/…` on Windows. That is not a valid path for `fs.existsSync` or `child_process.spawn` cwd. `path.resolve(dirname(fileURLToPath(import.meta.url)), '..')` is the canonical fix and required to run `tools/verify-acceptance.mjs` in the `windows-latest` cell. Every cross-platform script needs to be audited for the same class of bug - anywhere a URL is being coerced to a path via string manipulation is a Windows landmine.

Two secondary observations:

- **Cross-runtime jobs deserve their own dimension.** When two runtimes need to agree on an output (Throughspec's Node ↔ Python init parity), running each half of the test in its own matrix cell means one half can pass while the other fails. Instead, dedicate a `cross-lang-parity` job that installs _both_ runtimes on one runner and runs the comparison end-to-end. Losing the OS × runtime combinatorics is fine for the comparison - you already covered them in the single-runtime jobs.
- **The final "gate" job depends on the matrix jobs, not the matrix itself.** `acceptance-verify` runs `needs: [node-tests, python-tests, cross-lang-parity]`. That is a single job depending on three matrix groups; GitHub Actions treats "all cells green" as the group succeeding. This gives you a single required-check name to attach to branch protection - you do not have to enumerate 15 matrix cells.

The wider point: **CI is not a rubber stamp; it is the machine that surfaces the failure modes you did not anticipate.** Design it to spend the extra minutes discovering all of them per push, not to fail as fast as possible and hide the rest.

### npm provenance and PyPI trusted publishing: OIDC beats long-lived tokens

> Both publish workflows need registry credentials. Why is OIDC preferred over storing an npm/PyPI token as a repository secret?

Traditional publish flows store a long-lived registry token (`NPM_TOKEN`, `PYPI_TOKEN`) as a repository secret. The workflow reads it, calls `npm publish` or `twine upload`, and moves on. The token has no expiry, has full publish rights to your package, and lives in a place any workflow file in the repo can access. Rotate it and every fork that inherited a copy still has the old value.

OpenID Connect (OIDC) inverts the model. GitHub Actions produces a short-lived JSON Web Token (JWT) attesting to the workflow run: this repo, this workflow file, this commit SHA, this branch, this job. The registry (npm, PyPI) trusts GitHub's OIDC identity provider directly and verifies the JWT against a policy the maintainer configured - "allow publish only from `vishalpatil18/throughspec`, workflow `publish-npm.yml`, on the `main` branch or a `v*` tag". No long-lived token exists. Every publish carries a cryptographically verifiable receipt of what built it.

**npm provenance** goes one step further. With `--provenance` and `id-token: write`, `npm publish` embeds a Sigstore-style attestation into the published tarball's manifest. Consumers can run `npm audit signatures` (or the registry UI can show a "Verified" badge) and see the exact commit SHA that built this artifact. The pre-cursor is not just "someone with the token published this" but "this exact source ran through the CI configuration named in the workflow and produced this exact tarball." Supply-chain attackers who compromise the token no longer win; they would have to compromise the OIDC provider too.

**PyPI's trusted publisher** is the same shape. Configure it once on the PyPI project settings page ("this repo, this workflow, this environment"), and `uv publish` under `id-token: write` reaches back to GitHub for a fresh JWT on every run. The `PYPI_TOKEN` becomes a fallback for pre-configuration bootstrap only.

There is one operational subtlety: **trusted publishing requires the account to prove ownership of the package name first.** First upload of a new project still uses a token (or the PyPI web upload) because the registry needs to establish "this GitHub identity is authorized to publish under this name." From release two onward, the token can be revoked and OIDC takes over. Throughspec's `publish-pypi.yml` keeps the `UV_PUBLISH_TOKEN` env var as a fallback for the same reason.

The generalizable rule: **short-lived, scoped, verifiable credentials beat long-lived tokens for every high-stakes action.** Publishing to a public registry is high-stakes because the artifact goes to millions of downstream installers. Deploy tokens, service accounts, cloud credentials all follow the same pattern once OIDC is available: prefer identity from the runner to secrets on the runner.

### SemVer 0.x → 1.0: the version bump that ends the negotiating window

> Why does bumping from `0.1.0-alpha.0` to `1.0.0` matter beyond the changelog entry, and what does the "alpha" trove classifier actually change?

Under semantic versioning, `0.x.y` is a public statement that anything might change tomorrow. Minor bumps within `0.x` can be breaking. Consumers pin to `~0.1.0` or `==0.1.*` because they cannot trust the next minor. Tools that expect stability (Renovate, Dependabot, `pipx install --python`) treat `0.x` as "hold my hand."

`1.0.0` is the version where the maintainer accepts a constraint: no breaking change in the public API before `2.0.0`. Bumping to 1.0 is not just a marketing move - it is the promise that the shape of `spec-init init`, the location of the memory files, the schema of `CLAUDE.md`, and the semantics of every slash command will not shift out from under someone who wrote automation on top of them. That promise is why 1.0 releases require a spec-first, drift-proof foundation to stand on. Ship it too early and the promise is fiction.

Two consequences at the tool level:

1. **Trove classifiers.** PyPI's `Development Status` classifier is a filter dimension for search and discovery. `3 - Alpha` filters the package out of a lot of tooling queries and warns users at install time. `5 - Production/Stable` opens it up to production users, corporate installer allowlists, and the "Featured" tab. Flipping the classifier without meaning to keep the SemVer promise is a way to burn user trust in a way that no changelog entry recovers.
2. **Distributive stability.** Registry mirrors, corporate proxies, and package caches use the version number to decide what to cache and how long. Yanking a `1.0.0` - even for a genuine bug - is expensive because caches propagate. A pre-1.0 alpha can be yanked, patched, and re-released with fewer downstream headaches; a stable release requires a `1.0.1` and the SemVer contract to hold.

The prep work Throughspec did before flipping the version bit is the whole point of the ten-stage build plan. Every stage produced a "standalone, testable, runnable" deliverable. The 1.0 tag is not "we shipped a lot of features" - it is "we can prove each of these features runs to spec on every platform we support, and we will not break them without cutting a major version." SemVer major bumps exist so users can trust patch and minor bumps. Never flip to 1.0 until the CI matrix that would catch a regression is actually in place.

The generalizable rule: **version numbers are contracts with your users, not decorations on the release notes.** `0.x` says "changing our mind is free." `1.x` says "changing our mind costs a major version." Bump to 1.0 when the machinery that enforces the promise is standing under it - not before, not after.

### Interactive prompts in a non-interactive CLI: TTY-gating and injectable I/O

> How do you add an interactive prompt to a CLI whose whole test suite spawns it non-interactively - without breaking a single test?

A CLI can run two ways: a human at a terminal, or a script/CI/test harness piping it. The two must not collide. The trick is **TTY-gating**: `process.stdin.isTTY` (Node) / `sys.stdin.isatty()` (Python) is true only when stdin is a real terminal. When a test does `spawnSync('node', [cli, 'init', 'p'])`, the child's stdin is a pipe, not a TTY, so the gate is false and the prompt never fires. That means you can add an interactive picker and every existing spawn-based test stays green with zero changes - they simply never reach the prompt branch. The gate also carries the product rule: skip the prompt when the user already passed `--integrations` (explicit intent wins) or `--dry-run` (planning, not doing). One boolean expression - `!dryRun && integrations.length === 0 && isTty` - encodes all three.

The second half is **testability**. TTY-gating means the prompt is invisible to spawn tests, so how do you test the prompt's own logic (parsing "3 1" into the right subset, defaulting empty to none, "all" selecting everything)? You don't drive a real pseudo-terminal - that's slow and platform-specific. Instead you inject the I/O as parameters: `promptIntegrations(opts, { isTty, ask })` where `ask: () => string` returns the next input line. Production supplies the real stdin reader and `process.stdin.isTTY`; a unit test supplies `isTty: true` and a fake `ask` that yields queued answers (`['2', '3 1']` for "let me select, then pick items 3 and 1"). Now the branching, parsing, and gating are all exercised as pure function calls, and only the ~10-line raw-stdin reader is left untested - acceptable, because it's thin glue with no branches. The principle generalizes: **push side-effecting I/O to the edges behind an injectable seam, and the decision logic becomes ordinary testable code.**

A concrete gotcha this surfaced: reading one line synchronously from a TTY in Node has no clean stdlib call. `readline` is async (and would force the whole synchronous `runInit` to become async, rippling up to `main`), and `fs.readFileSync(0)` blocks until EOF rather than one line. The dependency-free answer is `fs.readSync(0, buf, 0, 1, null)` in a loop, accumulating bytes until `\n`. It keeps `runInit` synchronous and adds no package. Python has it easier - `input()` is already synchronous and line-oriented.

### Choosing "good enough, zero-dep" over a literal spec: the checkbox-TUI tradeoff

> The request said "checkbox style select with a submit button." Why ship a numbered list instead?

A literal terminal checkbox - arrow keys to move, space to toggle, Enter to submit - requires **raw mode**: you put the terminal into character-at-a-time, no-echo mode, then hand-parse ANSI escape sequences for arrow keys (`\x1b[A` / `\x1b[B`), repaint the list on every keystroke, manage cursor position, and restore cooked mode on exit (including on Ctrl-C, or you leave the user's terminal broken). That's ~150 lines _per language_, it's fragile across Windows/macOS/Linux terminals, and it's genuinely hard to unit-test. Libraries exist (`@inquirer/prompts`, `questionary`) but each is a new runtime dependency, which this project's constraints forbid (zero-cost, no-new-dep-for-what-few-lines-can-do).

The **outcome** the user actually needs is: choose a subset from a list and confirm. A numbered list - print `1) graphify 2) obsidian 3) caveman`, read a line like `1 3`, Enter submits - delivers exactly that outcome with the synchronous line-reader already built, no deps, no raw mode, and trivial testability. It loses only the _interaction texture_ (visual checkboxes vs typed numbers), not the capability. The lesson: separate the literal UI description from the functional requirement. When the literal form carries a large hidden cost (raw-mode state machine, a dependency, cross-platform fragility), implement the requirement the cheapest correct way and name the simplification out loud so the user can veto it if the texture genuinely matters. Shipping the 20-line version that does the job beats the 150-line version that does it prettier, until someone says the prettiness is the point.

### The cost of parity: one feature, three-to-five synchronized edit sites

> Why did adding one integration touch a Node file, a Python file, a standalone `.mjs` tool, AND their tests - for the _same_ constant?

Throughspec compresses to a single `templates/` payload but ships it through two CLIs (Node via npm, Python via PyPI) plus a standalone strip tool, and enforces byte-for-byte parity between them in CI. That design buys drift-proofing - a scaffold is identical whichever CLI produced it - but it means any shared constant lives in _n_ hand-written copies that a test asserts are equal. Adding `caveman` to the valid-integration set meant editing `INTEGRATIONS` in `args.ts`, `INTEGRATION_NAMES` in `integrations.ts`, the same list in `tools/strip-integrations.mjs`, the `Integration` Literal + tuple in `args.py`, and `INTEGRATION_NAMES` in `integrations.py` - five sites - because the strip regex validates marker names against that set and throws on an unknown one. Miss a single copy and the parity test fails loudly (which is the point: the test _is_ the safety net for the duplication).

This is a deliberate trade, and the codebase already recorded its own break-even: three implementations is the point where extracting the convention into one shared JSON/YAML spec would start to pay off, and a fourth implementation is the trigger to actually do it. The general lesson: **when you choose duplication for a good reason (here, two independent language ecosystems with no shared runtime), make the duplication _loud_ - a parity test that fails the instant the copies diverge - and write down the break-even count at which you'll collapse the copies into a single source.** Silent duplication rots; asserted duplication is just a distributed constant.

### Where a default behavior lives in a behavior-contract document

> The kit's CLAUDE.md has a "how you work" section (§2) and a "custom user instructions" section (§7). A new default - always suggest a commit message - could go in either. Why §2?

A layered instruction file usually has two kinds of sections that look interchangeable but are not: the **standing contract** (rules the tool ships and owns) and the **user overrides** (a placeholder area the end user fills with their own preferences). A default behavior - something true out of the box for every scaffolded project - belongs in the standing contract. Put it in the user-overrides section and it reads as a _suggestion the user is expected to edit or delete_, and worse, it sits among `_<e.g., "Never use class components">_` placeholders that a user will wipe out wholesale when they add their own rules. The section a line lives in is itself metadata about how binding and how permanent that line is. Match the instruction's intended lifetime to the section's semantics.

A second, mechanical reason reinforced the choice here: this CLAUDE.md is processed by a persona-stripper that keeps or removes fenced blocks per persona, and unmarked prose survives every strip. §2 is unmarked, so an invariant added there ships to all four personas unconditionally - exactly what "by default" means. If the same line went into a persona-fenced block, it would only reach some users.

### Adding to a numbered document without renumbering: protecting snapshot anchors

> Why add invariant #6 to an existing list instead of a cleaner new top-level section?

A test asserted that `## 9. Quick links` survives every persona strip, and the whole stripped file is snapshotted. Introducing a _new numbered section_ would either renumber everything after it (breaking the `## 9` anchor and producing a huge, noisy snapshot diff) or wedge an out-of-order number into the sequence. Appending an item to an _existing_ numbered list (§2's invariants, 5 → 6) leaves every section heading and number untouched, so the only snapshot delta is the single added line. The general rule when editing structured documents under snapshot/anchor tests: **prefer the edit that changes the fewest structural landmarks.** A smaller structural blast radius means a smaller diff to review, a cleaner snapshot update, and no collateral breakage of tests that pin specific headings - the same "shortest working diff" instinct that applies to code applies to load-bearing docs.

### Anatomy of an effective agent skill (and why terse beats verbose)

> The request asked for skills that are "very detailed" yet "low token cost". Those pull in opposite directions. How do you satisfy both?

An agent skill is a prompt the model reads _every time the skill fires_ - so its length is a recurring tax, not a one-time cost. "Very detailed" and "low token" reconcile once you separate **information density** from **word count**. A verbose skill pads with pleasantries, restated context, and three examples where one would do; a dense skill makes every line load-bearing. The reference skills that inspired this batch ran 300-400 lines each; the kit versions deliver the same operative content in ~90-140 by cutting the padding, not the substance.

The structure that carries the most signal per token, learned from the kit's existing skills:

1. **Frontmatter description = the router.** The model decides _whether_ to load a skill from its `description` alone. So the description must pack the trigger phrases ("review this", "is this secure"), the slash-command name, and the one-line behavior contract. A vague description means the skill never fires when it should, or fires when it should not - the most expensive failure, because it wastes a whole load.
2. **"Read first" front-loads context discipline.** Naming exactly which memory files to open (and telling the model _not_ to scan the repo) is what makes a skill token-lean in practice: the skill's own words are a fixed cost, but the reading it triggers is the variable cost, and that is where budgets actually blow.
3. **Numbered workflow + refusal clauses + red flags.** Steps give the model an order to follow; refusal clauses ("cannot proceed without X") are the highest-value lines because they stop expensive wrong work before it starts; red flags let the model self-check its own output.
4. **Guardrails as blockquotes, checklists as `- [ ]`.** These are machine-scannable shapes the model reliably re-reads, worth their tokens.

The generalizable rule: **a skill is a function the model calls repeatedly, so optimize it like hot-path code** - every line justified, context reads minimized, the decision-to-load encoded in the signature (the description). Detail lives in precision of instruction, not volume of prose.

### Consolidating overlapping capabilities into modes instead of separate skills

> Six of the requested skills were all "review X" (code, PR, frontend, backend, DB, comments). Why collapse them into one `spec-review` with modes rather than ship six files?

When several requested capabilities share ~80% of their content (here, the five-axis review method) and differ only in a facet (which checklist applies), six separate files create the exact defect a good review skill warns against: near-duplicate logic that drifts apart. Fix the five-axis method once and you would have to edit it in six places; miss one and the frontend reviewer silently diverges from the backend reviewer. Collapsing them into `spec-review <mode>` keeps the shared spine in one place and lets each mode add only its delta (the frontend checklist, the comments-rewrite behavior). Same for `spec-research knowledge|market` - one cite-or-flag discipline, two domains.

The counter-force is discoverability: a user who thinks "I want a PR review" may look for `/spec-pr-review` and not find it. The resolution is to make the modes first-class in the description and docs (so the router still fires on "review the PR") while keeping one implementation. The principle: **consolidate when the variants share the method and differ in a parameter; keep separate when they share only a theme.** `spec-security` and `spec-performance` stayed standalone precisely because they are deep, distinct methods - not facets of a common one. The test is not "are these related?" but "would a single change to the core need to touch all of them?" - if yes, they are one skill with modes.

### Extending a spec-driven kit without lying to the spec

> Adding 15 skills to a project whose SRS pins a "9 skills" catalog and whose validator tests cite FR-IDs. What keeps the addition honest?

A spec-driven project has two truth sources that can drift from each other: the running artifact (the skills on disk) and the spec that claims what exists (the SRS, the CLAUDE.md contract, the docs). Adding capability to the artifact without updating the spec creates a silent lie - the SRS says nine, the disk has twenty-four. The discipline here was to wire the spec in the same change: SRS §2.2.3, the CLAUDE.md contract, the README, and the website docs all updated alongside the skills, so no reader is misled about what ships. Where full reconciliation was too large for one change (the SRS acceptance line "All 9 skills"), the drift was _recorded as an open follow-up_ rather than left invisible - a named debt beats a hidden one.

The second honesty trap was FR-IDs. The kit's existing skills cite requirements like `FR-BUG-01` that exist in the SRS. It would have been easy to sprinkle `FR-REVIEW-01`-style anchors into the new skills to match the house style - but those requirements do not exist in the SRS, so the citations would be dangling references pointing at nothing. The new skills therefore cite the memory layer and SDD principles by name but invent no FR-IDs. The rule: **a reference is a promise that the target exists; never write one you cannot back.** Matching a surface convention (FR-anchors) is not worth manufacturing fake targets - honesty about what is specified beats cosmetic consistency.

### When an integration's tool fights the host: document the conflict, don't code around it

> openwiki generates prompting into the repo-root `CLAUDE.md` and `AGENTS.md`. ThroughSpec's entire design centers on `CLAUDE.md` being the behavior contract. Why did the integration handle this with a doc warning instead of code that protects the file?

An integration in a scaffolder is a thin wiring layer: it copies a guidance doc and adds marker blocks, then the _external tool_ runs later, on the user's machine, outside the scaffolder's control. There is no point at which ThroughSpec's code is running when `openwiki --update` rewrites `CLAUDE.md` - so there is nothing for ThroughSpec code to guard. Any "protection" would be fiction: a lockfile openwiki does not honor, a backup the user must remember to restore, a wrapper the user would have to invoke instead of the real CLI. The honest and effective control is to put the warning where the user is _at the moment of risk_ - in the integration's doc and the README block: "commit CLAUDE.md before running; review the diff; let it append, not overwrite." This is the same principle as calibration knobs on hardware: when the real world (here, a third-party tool) does something your model cannot prevent, you surface the seam and give the human the lever, rather than pretending code can close a gap it structurally cannot reach.

The generalizable rule: **a boundary you do not execute at is a boundary you cannot enforce - document it at the point of use instead.** Reserve code controls for what runs inside your process; for everything downstream, the highest-leverage artifact is a warning the user sees exactly when it matters.

### Designing a pattern so extensions cost almost nothing

> Adding the 4th and 5th integrations (agentmemory, openwiki) touched the same handful of files as the 1st and 2nd, and most of the machinery just absorbed them. What made the extension cheap?

The integration system was built so that the _variable_ part of adding an integration is tiny and the _fixed_ machinery reads from a single list. Two design choices paid off here. First, the interactive picker enumerates `INTEGRATIONS` dynamically (`INTEGRATIONS.forEach(...)`) rather than hardcoding option rows - so a new integration appears in the "let me select" menu with zero picker changes. Second, the strip/apply/parity machinery is data-driven off the name-list and the `_integrations/<name>/` tree, so "support a new integration" reduces to: add the name to the lists, drop a payload folder, add the marker blocks. The only places that needed hand-editing were the genuinely per-integration content (the doc, the CLAUDE.md/README blocks) and the _one_ test that hardcoded the full set (the `all`-selects-everything assertion).

That last point is the tell for where a pattern still leaks: every hardcoded enumeration of the set is a place the next extension must remember to touch. The parity tests that iterate `ACTIVE_SETS` and the marker-file map are cheap to extend (one line each); the assertion that spelled out `['graphify','obsidian','caveman']` was the friction. The lesson: **when you build an extensible pattern, make the fixed machinery read from one canonical list, and audit your tests for hardcoded copies of that list - a test that re-enumerates the set converts every future addition into a test edit.** The dynamic-enumeration tests (Python's prompt tests asserting `== INTEGRATIONS`) needed no change at all; the enumerated ones did. Prefer the former.

### Describe a dependency by what it does, not by how the requester framed it

> The request said "add ponytail for agent orchestration and workflow management." Ponytail is actually a code-minimalism ruleset, not an orchestrator. Why did the integration describe it as minimalism instead of echoing the requester's words?

Documentation is a promise about what something does. When a user's framing of a third-party tool is generous or slightly off ("orchestration" for what is really a YAGNI code-discipline plugin), copying that framing into the shipped docs launders a misconception into every scaffolded project - future readers trust the doc, hit the gap between the label and the behavior, and lose confidence in the whole kit. The fix is to fetch the source, learn the tool's real function, and write the honest description, while still honoring the user's intent (they wanted it added and wanted it to shape the workflow - both true of a minimalism ruleset). Honesty and helpfulness are not in tension here: the tool is added as asked, and the label just tells the truth ("code-minimalism discipline, the code-generation-time complement to the review skills") instead of overstating it.

The general rule: **when wiring in an external dependency, the description is sourced from the dependency, not from the request.** A requester's one-line framing is a starting hypothesis to verify, not a spec to transcribe - especially in artifacts that outlive the conversation and get read by people who never saw the original ask.

### Non-destructive by default: the safe rung when a command writes into a user's existing files

> `reinit` adopts Throughspec into a repo that already has files. Why is the default to KEEP existing files and require `--force` (or an explicit prompt) to replace them, rather than the other way round?

When a command writes into a directory the user already owns, the cost of the two possible mistakes is wildly asymmetric. If the default is "keep" and the user actually wanted a fresh template, the fix is trivial and non-destructive: run again with `--force`, or delete the file and re-run. If the default is "replace" and the user wanted to keep their hand-written `CLAUDE.md`, the mistake is destructive - their work is gone (recoverable only from git, if they committed). So the safe default is the one whose failure mode is cheap and reversible. This is the same instinct behind `init` refusing to overwrite a non-empty directory: the tool never destroys user data as a side effect of a convenience action. The rule generalizes: **when a default could either preserve or destroy user data, default to preserve, and make destruction an explicit, named choice (`--force`, a typed "replace").** Non-interactive contexts (CI, piped stdin) must resolve to the safe default too, because there is no human there to catch a bad guess - so `reinit` treats non-TTY as "keep", never "replace".

A corollary: the command must also be surgical about _what_ it is allowed to touch. `reinit` writes only files from the template payload; it never reads or writes the user's source code. Scoping the blast radius to "files this tool owns" is what makes "adopt into an existing project" safe to run at all.

### Reuse across commands via targeted exports, not premature refactor

> `reinit` shares most of its machinery with `init` (walk the payload, strip persona/integration blocks, copy integration files, prompt for integrations, snapshot the base). How was that reuse achieved without a big refactor?

There were three ways to share code between `init` and the new `reinit`: (a) copy-paste the helpers, (b) extract a new shared module both import, or (c) export the handful of already-correct helpers from `init` and have `reinit` import them. Copy-paste rots (the two drift). A shared module is the "clean" textbook answer but it is a larger, riskier change: it moves `init`'s working code, touches `init`'s imports, and risks regressing a shipped command for a refactor nobody asked for. The lazy-correct choice was (c): add `export` to the three pure helpers `init` already had (`walkPayload`, `maybeTransform`, `readLineSync`) - a zero-behavior-change edit - and import them into `reinit`. The write loops themselves differ (reinit has keep/replace logic and writes in place; init writes into a fresh subdir and refuses non-empty), so those stayed separate rather than being forced behind a shared abstraction that would need flags to serve both.

The lesson: **reuse at the smallest honest seam.** Export the stable leaf helpers and let each command keep its own orchestration, rather than hoisting a shared "engine" that both commands must now bend to. And when the same output _does_ want to be identical (here, the post-init "next steps" checklist), a one-line parameter (`verb`) beats duplicating the block - so `reinit` prints "Initialized" where `init` prints "Scaffolded" from a single source. Extract the coincidence only where it is truly the same thing; keep the parts that merely rhyme separate.

### An "advisory" config is only real if something actually consumes it

> The user asked for a spec.config.js holding "all the configuration." The trap: a config file that nothing reads is decoration - it drifts, misleads, and does nothing. How was this one made real without building a config engine?

Configuration has exactly two honest shapes. Either a **machine consumer** parses it and acts on it (a CLI reads `skills.disabled` and physically removes those skill files), or a **reasoning consumer** reads it and honors it (Claude reads the file each session and chooses to avoid those skills). What you must never ship is a third shape: a config with no consumer at all - it looks like it works, users edit it expecting effect, and nothing changes. In a Claude-driven kit the cheapest real design is the reasoning consumer: `spec.config.js` is made functional by a single line in CLAUDE.md ("read spec.config.js and honor it") - Claude reads it every session exactly as it reads the behavior contract, so the config genuinely changes behavior without any parser, schema, or build step. The lesson: **before adding a config surface, name its consumer in one sentence.** If you can't, you're adding decoration. "Claude reads it and CLAUDE.md tells it to obey" is a valid consumer; "it exists" is not.

A corollary on avoiding a _second_ source of truth: the file was scoped to hold only the knobs nothing else owns (skill preferences, workflow toggles, custom instructions). Persona and integrations were deliberately left OUT, because the CLI already owns them in meta.json - putting them in spec.config too would create two places that disagree the moment `customize` runs. When you add a config file to a system that already has config, the first question is not "what can it hold?" but "what does nothing else already own?"

### Why the config is `.js` read-as-text and not a CLI-parsed file: the dual-runtime constraint

> The user said `spec.config.js`. Throughspec ships both a Node and a Python CLI with byte-parity. Why did that combination force the config to be Claude-read rather than CLI-read?

A `.js` file is executable JavaScript - to extract its values you must run a JS engine. The Node CLI could `require()` it; the Python CLI cannot, short of shipping a JS interpreter. So the instant a `.js` config becomes something the _CLI_ must read, you have broken the zero-drift guarantee that both CLIs produce identical results - the Python side simply can't see the config. The resolution wasn't to fight the extension but to change the consumer: if **Claude** (not the CLI) reads the file, the executability question evaporates, because Claude reads it as plain text and the file is just another static payload byte-copied into both packages. This is why the design note "the CLI never parses it" is load-bearing, not a throwaway - it is the exact property that lets a `.js` file live safely in a dual-runtime tool.

The subtlety that falls out of "read as text, never executed": the file uses CJS `module.exports`, which is technically mismatched in a scaffolded project whose `package.json` is `"type": "module"`. In a normal library that would be a bug. Here it is a non-issue precisely because nothing ever executes it - and the test that "requires" it passes only because a fresh scaffold has no `package.json`, so `.js` defaults to CJS. The general principle: **when a file's contract is "read, don't run," its module system is cosmetic - but say so explicitly in the file header**, so no future reader mistakes it for an importable module and wires an `import` that breaks under the other module type.

### A TTY gate lets you add an interactive UI without breaking a single non-interactive contract

> Bare `spec-init` used to print help and exit 2, and a test asserts exactly that. How do you turn bare invocation into a rich interactive welcome without breaking that test - or scripts and CI that run the tool non-interactively?

The key is that "a human at a terminal" and "a script/pipe/CI" are distinguishable at runtime: `process.stdin.isTTY` is true only for the former. Gate the new interactive behavior on it - `shouldLaunchWelcome = bare && !help && !version && isTty` - and the two audiences never collide. A human running `spec-init` gets the welcome; a `spawnSync`/piped/CI invocation has no TTY, falls through to the old help+exit-2 path, and every existing test stays green with zero changes. This is the same principle that made the earlier `promptIntegrations`/`reinit` prompts safe: **the TTY check is not a UX nicety, it is the compatibility boundary** - it's what lets you layer interactivity onto a tool whose scripted contract must not change. Extract the gate as a pure function (`shouldLaunchWelcome(opts, isTty)`) so the branching logic is unit-testable even though the interactive flow behind it needs a real terminal.

A second reuse lesson fell out of it: the TUI should not re-implement scaffolding. `runInit`/`runReinit` already do the writing - but they also prompt and print their own summaries, which a polished TUI must own instead. The clean seam was a `quiet` flag that suppresses their prompts and stdout, letting the TUI drive interaction with @clack, call the same scaffolding core, and render results itself via the already-shared `postInitChecklist`. So there is still exactly one implementation of "scaffold a project," reached two ways (flags vs TUI). When adding a second front-end to existing logic, add a "who owns I/O" switch to the core rather than forking it.

### Load an optional heavy dependency only on the path that needs it

> The welcome needs @clack/prompts, but 99% of CLI invocations are plain commands (`init`, `doctor`, `upgrade`) that should stay fast and shouldn't pay for a TUI library. How do you add the dependency without taxing every run?

A static top-level `import '@clack/prompts'` in the entry module loads it on every invocation, even `spec-init doctor`. Since the welcome is the only consumer and it's reached through a single branch, the fix is a **dynamic import on that branch**: `if (shouldLaunchWelcome(...)) { const { runWelcome } = await import('./commands/welcome.js'); ... }`. Now @clack (and the whole TUI module) is loaded only when a human actually opens the welcome; every scripted command skips it entirely. This also hardens the common path: if the TUI dependency were ever missing or broken, plain commands still work because they never import it. The cost is that the entry point becomes async - acceptable here because nothing imported `main` directly (verified before changing it). The general rule: **a dependency used by one branch should be imported by that branch, not by the module** - dynamic import turns "always paid" into "paid only when used," and quarantines the failure blast radius to the feature that needs it.

### Why a spec's format is a performance lever, not just a style choice

> An LLM reads a spec on every reasoning turn. Why render deeply-nested data as YAML instead of keeping everything in readable Markdown prose or JSON?

A model does not "see" your data structure - it sees a token stream, and every character costs budget, latency, and attention capacity, multiplied across every turn of a multi-step task. Two properties of the format matter. First, **token economy**: deeply-nested JSON spends a large fraction of its tokens on structural punctuation (`{`, `}`, `"`, `,`) and indentation; flat YAML carries the same information with far less syntax, so the same schema costs fewer tokens each time it is read. Second, **parse reliability**: models reconstruct structure from text more accurately for shallow, whitespace-delimited formats than for deep brace-nested ones - the deeper the nesting, the more often the model mis-associates a value with the wrong key. So the rule that emerged: keep the parts a human reads as a narrative in Markdown (headings anchor the model's attention), but the moment you hit structured config or a schema nested beyond ~3 levels, drop into a flat fenced YAML block. The general lesson: **in a spec-driven system the instruction file is hot-path input, so treat its format like you'd treat a hot loop** - the cheapest representation that stays unambiguous wins, and that trade tips from "prose is friendliest" to "flat YAML is cheapest" exactly at the point where structure gets deep.

### Requirements that name their failure conditions: why Given/When/Then beats a feature list

> A functional-requirements table already says what the system must do. Why also write Given/When/Then scenarios for each one?

"The app has login" is not testable - it names a capability but not a single correct behavior, and an agent handed only that will invent the edge cases (or ignore them). Forcing each load-bearing requirement into **State -> Action -> Outcome** - Given a starting state, When an action happens, Then this exact outcome - does something a flat list cannot: it makes you specify the _failure_ conditions before any code exists. The success scenario is the easy half; the mandatory edge/failure scenario (empty input, expired token, unauthorized caller, downstream timeout) is where unspecified behavior would otherwise silently become a bug six weeks later. This pays a second dividend downstream: the scenario is already the shape of a test. The planning step can stage work against concrete scenarios instead of vague features, and the bug/feature workflows can write the failing test _first_ by transcribing the relevant scenario. The principle: **a requirement isn't done when you've named the feature - it's done when you've named what "wrong" looks like**, and Given/When/Then is the cheapest structure that forces that naming.

### Guardrails against two quiet failure modes: stale versions and stray literals

> Why bake "pin and verify library versions" and "never hardcode secrets/PII/URLs into specs" into the behavior contract, rather than trusting the agent's judgment?

Both are failure modes that come from _how models work_, so a one-off reminder won't hold - they belong in the standing contract. First, **stale versions**: a model's knowledge has a training cutoff, so left to itself it confidently suggests whatever release was current when it was trained - often months or years old. Pinning an explicit version in the spec and verifying it against current docs converts "the model guessed" into "the human decided," which is the whole point of spec-driven work. Second, **stray literals**: when an agent lacks a value it needs, it fills the gap with whatever plausible string is already in its context - which is exactly how a hardcoded email or internal URL in a spec becomes an action taken against the real thing. Referencing an env var or config key instead of a literal means there is no sensitive string in context for the agent to reuse. Both guardrails share a shape: **anticipate the specific way a probabilistic system fills gaps, and remove the gap or the tempting-but-wrong filler** - stale training data and stray context literals are predictable, so the contract pre-empts them rather than hoping the model resists.

### Fit the new thing to the invariant; collapse a growing enumeration into a pointer

> Two small decisions came up adding the 7th integration: the repo name has hyphens but marker keys are regex-gated to `[a-z]+`, and the `--integrations` help line had been listing every valid name inline. Why rename the key rather than widen the regex, and why stop listing the names in help?

First, **adapt the addition, not the invariant.** The strip machinery matches integration markers with `<!-- integration:([a-z]+) -->`, and that regex is duplicated across three byte-parity implementations. Widening it to allow hyphens to accommodate one repo name would touch all three, expand the surface that must stay in sync, and admit a class of names (with punctuation) that could collide with the marker syntax later. Renaming the key to a hyphenless `opencodereview` (display name and CLI stay as the tool ships them) costs one word and leaves the invariant - and its parity surface - untouched. The rule: when a new item doesn't fit a load-bearing constraint, first try to reshape the item; only weaken the constraint if reshaping is genuinely lossy. Here it wasn't - a key is an internal identifier, free to differ from the human-facing name.

Second, **a hand-maintained enumeration of a list you already own is duplication waiting to drift.** The `--integrations` help text had been spelling out all valid names; every new integration meant editing that string too, and by seven names it was both long and a second place to forget. The fix was to stop enumerating in help and point to the README, because the _authoritative_ list already exists in one place (the `INTEGRATIONS` constant) and surfaces two ways that never go stale: the validation error builds its "valid: ..." message from that constant dynamically, and the README blocks are generated per-integration. The lesson generalizes the earlier "asserted duplication" note to human-facing text: **prose that restates a machine-maintained list is the copy most likely to rot - replace it with a pointer to the source, or generate it, rather than hand-syncing it on every addition.**

### A copy button's feedback belongs on the button, not in a floating toast

> The copy buttons popped a "Copied to clipboard" toast on click. Why is a tooltip that reads "Copy" then "Copied" the better pattern?

Feedback should appear where the user's attention already is. When you click a copy button, your eyes are on that button - a toast that animates in somewhere below it splits attention and adds motion noise for a trivial, expected action. A tooltip anchored to the button keeps the acknowledgement exactly where the click happened, and folding it into the same element that shows the "Copy" affordance means one control does both jobs: it tells you what the button does (on hover) and that it worked (on click). The state machine is tiny - a `copied` boolean, set true on click, reset after ~1.8s - and the visibility is pure CSS (`opacity-0 group-hover:opacity-100`, forced visible while `copied`), so there's no animation library needed for what was previously a framer-motion toast. The general UI lesson: **for confirming a small, local action, co-locate the feedback with the trigger and prefer a state flip over an entrance animation** - a toast is for events the user isn't looking at (a background save finished), not for the button they just pressed.

The accessibility half matters too: a purely visual tooltip is invisible to screen readers, so the state also flips the button's `aria-label` (`Copy` -> `Copied`) and a visually-hidden `role="status"` region announces "Copied to clipboard" once. Visual polish and the a11y signal are separate channels; a good component drives both from the same `copied` state rather than dropping one.

### When to hand-roll a parser instead of pulling a library

> Rendering markdown in the changelog could have used react-markdown. Why a ~25-line hand-rolled tokenizer instead?

The decision hinges on the size and shape of the input, not on "markdown = use a markdown library" reflex. The changelog notes are one-line strings using exactly four inline constructs (code, bold, italic, link). A full markdown stack (remark + rehype + react-markdown) parses block structure, GFM tables, HTML passthrough, and more - none of which a bullet needs - and drags a large dependency tree into a site that deliberately ships none. A single regex with four alternations, matched left-to-right with the highest-priority pattern first (code before everything, so markdown inside a code span stays literal), covers the real inputs in a fraction of the code and zero new dependencies. The trade you accept is explicit: no nested or block markdown, which the content doesn't use. The rule: **reach for the library when the input's variety exceeds what you can enumerate; hand-roll when you can list every case the data actually contains.** And keep the parser pure and separate from rendering (tokens out of a `lib/` function, JSX in the component) so the risky part - the parsing - is testable on its own without a DOM.

### Regex alternation is greedy per-position: a bold-wrapped link gets swallowed

> The docs callouts render markdown, and `**[The Memory Layer](/docs/memory-layer/)**` showed up as literal bracket-and-paren text in bold, not a link. Why?

The inline tokenizer is one regex with alternations, `code | link | bold | italic`, scanned left-to-right with `exec` in a loop. At each step JS finds the _leftmost_ position where _any_ alternative matches, then - crucially - among alternatives that can start at that same position, it takes the _first one listed_ that succeeds. For `**[x](y)**`, position 0 is `*`. The link alternative `\[([^\]]+)\]\(([^)]+)\)` can't start on `*`, so it fails there. But the bold alternative `\*\*([^*]+)\*\*` matches at position 0, and its `[^*]+` body happily consumes the entire `[x](y)` (no asterisks inside). Bold wins, captures the link syntax as its literal text, and since the renderer emits a bold token's value as plain text (it does not re-parse the inner string), you see the raw `[x](y)`.

This is the general failure mode of flat, non-recursive inline tokenizers: **they don't nest.** A real markdown parser recurses into a bold node and re-tokenizes its children, so bold-around-link works. A one-pass regex tokenizer treats the first matching construct as a leaf and stops. Two ways out: (1) re-parse each token's value recursively (turns the leaf into a subtree - more code, the thing we avoided by hand-rolling), or (2) don't author the overlap - write the link bare, `[x](y)`, and let its own styling carry the emphasis. For a handful of doc strings, option 2 is the lazy correct move: the constraint costs nothing because a styled link already reads as emphasized. The durable lesson is to know your tokenizer's ceiling (no nesting) and author content within it, rather than discovering the ceiling as a rendering bug.

### Client-side search that's built, not served: why the index vanishes in dev

> Docs search "didn't work" locally. It wasn't broken - the index simply doesn't exist under `next dev`.

Pagefind is a _static_ search engine: after the site's HTML is emitted, a post-build script (`scripts/build-search.mjs`) crawls the exported `out/` directory, reads the rendered `<body>` of every page, and writes a binary index plus a JS runtime into `out/pagefind/`. The search modal then lazy-loads `/pagefind/pagefind.js` at query time and runs entirely in the browser - no server, no API, zero hosting cost. The consequence is structural: `next dev` never runs the export step, so `/pagefind/` isn't there, and the dynamic import throws. The old code caught the throw, logged a warning, and left the results empty - indistinguishable from "no matches," which is what made it feel broken.

The fix is to make the _unavailable_ state distinct from the _empty_ state. A dynamic import that fails is a different fact than a search that returned nothing, and the UI should say so: an explicit "index is generated at build time - run `npm run build`" message, shown only when the runtime failed to load. The broader principle for build-time-generated assets: **absence in dev is expected, not exceptional, so surface it as its own explained state rather than folding it into a generic empty result.** A silent catch that collapses two different truths into one output is a debugging trap - the person testing has no way to tell "it's not indexed here" from "your query matched nothing."
