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
