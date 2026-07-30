# spec-init CLI fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three reported `spec-init` issues — add a create-app shorthand, make `upgrade` conflict-free by transforming the raw base snapshot on read, and surface the active persona in `spec.config.js` — at full parity across the Node and Python CLIs.

**Architecture:** Both CLIs mirror each other file-for-file. `.spec-init/base/` stays a raw payload snapshot (its markers are load-bearing for `customize`); `upgrade` applies the recorded persona/integration transform to `base` and `theirs` on read so the three-way merge sees stripped output on both sides. A single CLI-managed comment line in `spec.config.js` carries the active persona, and `upgrade` normalizes that line out of the merge so it can never conflict.

**Tech Stack:** TypeScript (Node CLI, `vitest`), Python 3.12 (Python CLI, `pytest`), shared Markdown/JS payload in `templates/` and `packages/cli-python/_payload/`.

## Global Constraints

- Node CLI source: `packages/cli-node/src/*.ts`, ESM NodeNext, imports use `.js` extensions. Build: `npm run build` in `packages/cli-node` (compiles TS, copies `templates/` → `dist/templates`).
- Python CLI source: `packages/cli-python/src/spec_init/`. Tests run with `pytest` from `packages/cli-python` (PYTHONPATH = `src`).
- **`packages/cli-python/_payload/` is a GENERATED, gitignored artifact** — `_build.py` copies `templates/` → `_payload/`. `templates/spec.config.js` is the ONLY source of truth. Never hand-edit or commit `_payload/`. After any `templates/` change, regenerate it with `PYTHONPATH=packages/cli-python/src python3 -m spec_init._build` so the Python subprocess tests (which read `_payload/` via `resolve_payload_dir`) see the change. (Task 1 already added the persona line to `templates/` and regenerated `_payload/`.)
- The two CLIs and the two `spec.config.js` payload copies must stay behavior-identical.
- `.spec-init/base/` must remain the **raw** payload (do not strip it on disk) — `customize` re-derives from its markers.
- The managed persona line is exactly: `// active-persona: <none>   // managed by spec-init - change via ` + backtick + `spec-init customize --persona` + backtick. Value `<none>` when no persona.
- Do not touch the welcome TUI, doctor checks, or integration file contents.
- Commit only when the user asks (per repo CLAUDE.md / harness).

---

### Task 1: Add the managed persona line to both payloads

**Files:**
- Modify: `templates/spec.config.js` (before `module.exports`)
- Modify: `packages/cli-python/_payload/spec.config.js` (before `module.exports`)

**Interfaces:**
- Produces: the sentinel line `// active-persona: <none> ...` that `stampPersona` / `stamp_persona` (Tasks 3, 7) and `upgrade` (Tasks 4, 8) target.

- [ ] **Step 1: Edit `templates/spec.config.js`** — insert the managed line between the header comment and `module.exports`. The region currently reads (lines 11-13):

```js
//     They are recorded in .spec-init/meta.json and CLAUDE.md section 8.

module.exports = {
```

Change to:

```js
//     They are recorded in .spec-init/meta.json and CLAUDE.md section 8.

// active-persona: <none>   // managed by spec-init - change via `spec-init customize --persona`

module.exports = {
```

- [ ] **Step 2: Apply the identical edit to `packages/cli-python/_payload/spec.config.js`** (same surrounding lines, same inserted line).

- [ ] **Step 3: Verify both files carry the line**

Run: `grep -c "active-persona: <none>" templates/spec.config.js packages/cli-python/_payload/spec.config.js`
Expected: both files report `1`.

---

### Task 2: Node — create-app shorthand in the argv parser

**Files:**
- Modify: `packages/cli-node/src/args.ts:69-73` (the `opts.command === null` branch) and remove the now-unused `takeCommand` (`args.ts:86-89`)
- Test: `packages/cli-node/test/args.test.ts` (create)

**Interfaces:**
- Consumes: `CliOptions`, `COMMANDS`, `parseArgs` from `args.ts`.
- Produces: `parseArgs(['my-project'])` → `{ command: 'init', positional: ['my-project'] }`.

- [ ] **Step 1: Write the failing test** — create `packages/cli-node/test/args.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseArgs } from '../src/args';

describe('parseArgs shorthand', () => {
  it('treats a bare non-command token as implied init', () => {
    const opts = parseArgs(['my-project']);
    expect(opts.command).toBe('init');
    expect(opts.positional).toEqual(['my-project']);
  });

  it('still parses an explicit init command', () => {
    const opts = parseArgs(['init', 'my-project', '--persona', 'student']);
    expect(opts.command).toBe('init');
    expect(opts.positional).toEqual(['my-project']);
    expect(opts.persona).toBe('student');
  });

  it('leaves command null when no args are given', () => {
    const opts = parseArgs([]);
    expect(opts.command).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cli-node && npx vitest run test/args.test.ts`
Expected: FAIL — the first test throws `unknown command: my-project`.

- [ ] **Step 3: Implement the parser change** — in `packages/cli-node/src/args.ts`, replace the branch at lines 69-73:

```ts
    } else if (opts.command === null) {
      opts.command = takeCommand(token);
    } else {
      opts.positional.push(token);
    }
```

with:

```ts
    } else if (opts.command === null) {
      if ((COMMANDS as readonly string[]).includes(token)) {
        opts.command = token as Command;
      } else {
        // Implied init: `spec-init my-project` == `spec-init init my-project`.
        opts.command = 'init';
        opts.positional.push(token);
      }
    } else {
      opts.positional.push(token);
    }
```

Then delete the now-unused `takeCommand` function (lines 86-89):

```ts
function takeCommand(token: string): Command {
  if ((COMMANDS as readonly string[]).includes(token)) return token as Command;
  throw new UsageError(`unknown command: ${token} (try one of: ${COMMANDS.join(', ')})`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/cli-node && npx vitest run test/args.test.ts`
Expected: PASS (3 tests).

---

### Task 3: Node — persona stamp helper and wiring

**Files:**
- Modify: `packages/cli-node/src/persona.ts` (append `stampPersona`)
- Modify: `packages/cli-node/src/commands/init.ts` (stamp `spec.config.js` in the write loop)
- Modify: `packages/cli-node/src/commands/reinit.ts` (stamp `spec.config.js` in the write loop)
- Modify: `packages/cli-node/src/commands/customize.ts` (stamp on `--persona`)
- Test: `packages/cli-node/test/persona.test.ts` (create)

**Interfaces:**
- Produces: `stampPersona(text: string, persona: Persona | null): string` — replaces the `// active-persona:` line; returns text unchanged if the line is absent.

- [ ] **Step 1: Write the failing test** — create `packages/cli-node/test/persona.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { stampPersona } from '../src/persona';

const TEMPLATE = '// active-persona: <none>   // managed by spec-init - change via `spec-init customize --persona`\n\nmodule.exports = {};\n';

describe('stampPersona', () => {
  it('stamps a persona into the managed line', () => {
    const out = stampPersona(TEMPLATE, 'student');
    expect(out).toContain('// active-persona: student   // managed by spec-init');
    expect(out).toContain('module.exports = {};');
  });

  it('replaces an existing value (idempotent-ish)', () => {
    const stamped = stampPersona(TEMPLATE, 'student');
    const restamped = stampPersona(stamped, 'engineer');
    expect(restamped).toContain('// active-persona: engineer   // managed by spec-init');
    expect(restamped).not.toContain('active-persona: student');
  });

  it('leaves text without the managed line untouched', () => {
    expect(stampPersona('module.exports = {};\n', 'team')).toBe('module.exports = {};\n');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cli-node && npx vitest run test/persona.test.ts`
Expected: FAIL — `stampPersona` is not exported.

- [ ] **Step 3: Implement `stampPersona`** — append to `packages/cli-node/src/persona.ts`:

```ts
const ACTIVE_PERSONA_RE = /^\/\/ active-persona:.*$/m;
const MANAGED_SUFFIX = '   // managed by spec-init - change via `spec-init customize --persona`';

/** Replace the CLI-managed `// active-persona:` line with `persona` (or `<none>`). No-op if absent. */
export function stampPersona(text: string, persona: Persona | null): string {
  const line = `// active-persona: ${persona ?? '<none>'}${MANAGED_SUFFIX}`;
  return ACTIVE_PERSONA_RE.test(text) ? text.replace(ACTIVE_PERSONA_RE, line) : text;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/cli-node && npx vitest run test/persona.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire into `init.ts`** — add the import and stamp `spec.config.js`. At the top with the other imports:

```ts
import { stripPersonas, stampPersona } from '../persona.js';
```

(replace the existing `import { stripPersonas } from '../persona.js';`). Then in the base-file write loop (`init.ts:65-72`), change:

```ts
    const content = maybeTransform(rel, readFileSync(src, 'utf8'), opts.persona, integrations);
    writeFileSync(dest, content);
```

to:

```ts
    let content = maybeTransform(rel, readFileSync(src, 'utf8'), opts.persona, integrations);
    if (rel === 'spec.config.js' && opts.persona) content = stampPersona(content, opts.persona);
    writeFileSync(dest, content);
```

- [ ] **Step 6: Wire into `reinit.ts`** — add `stampPersona` to the existing `./init.js`? No — import from `../persona.js`:

```ts
import { stampPersona } from '../persona.js';
```

Then in the base-file loop (`reinit.ts:69-76`), change:

```ts
    const content = maybeTransform(
      rel,
      readFileSync(join(payloadDir, rel), 'utf8'),
      opts.persona,
      integrations,
    );
    writeFileSync(dest, content);
```

to:

```ts
    let content = maybeTransform(
      rel,
      readFileSync(join(payloadDir, rel), 'utf8'),
      opts.persona,
      integrations,
    );
    if (rel === 'spec.config.js' && opts.persona) content = stampPersona(content, opts.persona);
    writeFileSync(dest, content);
```

- [ ] **Step 7: Wire into `customize.ts`** — add the import:

```ts
import { stripPersonas, stampPersona } from '../persona.js';
```

(replace existing `import { stripPersonas } from '../persona.js';`). Then, immediately before the final `process.stdout.write('[OK] customize: ...')` call (`customize.ts:79`), add:

```ts
  if (mode === 'persona' && nextMeta.persona) {
    const cfg = join(projectRoot, 'spec.config.js');
    if (existsSync(cfg)) writeFileSync(cfg, stampPersona(readFileSync(cfg, 'utf8'), nextMeta.persona));
  }
```

(`existsSync`, `readFileSync`, `writeFileSync`, `join` are already imported in `customize.ts`.)

- [ ] **Step 8: Type-check**

Run: `cd packages/cli-node && npx tsc -p tsconfig.json --noEmit`
Expected: no errors.

---

### Task 4: Node — conflict-free upgrade (transform-on-read)

**Files:**
- Modify: `packages/cli-node/src/commands/upgrade.ts`

**Interfaces:**
- Consumes: `maybeTransform`, `INTEGRATIONS_PREFIX` from `./init.js`; `stampPersona` from `../persona.js`.
- Produces: an `upgrade` that produces no false conflicts on persona/integration-marked files and no conflict on `spec.config.js`.

- [ ] **Step 1: Add imports** — in `packages/cli-node/src/commands/upgrade.ts`, add below the existing imports:

```ts
import { maybeTransform, INTEGRATIONS_PREFIX } from './init.js';
import { stampPersona } from '../persona.js';
```

- [ ] **Step 2: Add a meta reader** — add this helper near the bottom of `upgrade.ts`:

```ts
interface Meta {
  persona: import('../args.js').Persona | null;
  integrations: import('../args.js').Integration[];
}

/** Read persona + integrations recorded at init; defaults for older/absent snapshots. */
function readMeta(projectRoot: string): Meta {
  const p = join(projectRoot, '.spec-init', 'meta.json');
  if (!existsSync(p)) return { persona: null, integrations: [] };
  try {
    const raw = JSON.parse(readFileSync(p, 'utf8'));
    return {
      persona: raw.persona ?? null,
      integrations: Array.isArray(raw.integrations) ? raw.integrations : [],
    };
  } catch {
    return { persona: null, integrations: [] };
  }
}
```

- [ ] **Step 3: Transform base + theirs on read and normalize spec.config.js** — in `runUpgrade`, after `const theirsDir = resolvePayloadDir();` add:

```ts
  const meta = readMeta(projectRoot);
```

Then replace the loop body's read section (`upgrade.ts:28-35`):

```ts
  for (const rel of walk(theirsDir)) {
    const basePath = join(baseDir, rel);
    const oursPath = join(projectRoot, rel);
    const theirsPath = join(theirsDir, rel);

    const theirs = readFileSync(theirsPath, 'utf8');
    const base = existsSync(basePath) ? readFileSync(basePath, 'utf8') : '';
    const ours = existsSync(oursPath) ? readFileSync(oursPath, 'utf8') : base;
```

with:

```ts
  for (const rel of walk(theirsDir)) {
    if (rel.startsWith(INTEGRATIONS_PREFIX)) continue; // integration trees are not project-root files

    const basePath = join(baseDir, rel);
    const oursPath = join(projectRoot, rel);
    const theirsPath = join(theirsDir, rel);

    let theirs = maybeTransform(rel, readFileSync(theirsPath, 'utf8'), meta.persona, meta.integrations);
    let base = existsSync(basePath)
      ? maybeTransform(rel, readFileSync(basePath, 'utf8'), meta.persona, meta.integrations)
      : '';
    let ours = existsSync(oursPath) ? readFileSync(oursPath, 'utf8') : base;

    if (rel === 'spec.config.js') {
      // Neutralize the CLI-managed persona line on all three sides so it never conflicts.
      base = stampPersona(base, null);
      theirs = stampPersona(theirs, null);
      ours = stampPersona(ours, null);
    }
```

(The `base`, `theirs`, `ours` are now `let`; the rest of the loop body is unchanged.)

- [ ] **Step 4: Re-stamp spec.config.js after the loop** — after the loop and the snapshot-refresh block, before `printReport(...)`, add:

```ts
  if (!opts.dryRun && meta.persona) {
    const cfg = join(projectRoot, 'spec.config.js');
    if (existsSync(cfg)) writeFileSync(cfg, stampPersona(readFileSync(cfg, 'utf8'), meta.persona));
  }
```

(`writeFileSync` is already imported in `upgrade.ts`.)

- [ ] **Step 5: Type-check and run the full node test suite**

Run: `cd packages/cli-node && npx tsc -p tsconfig.json --noEmit && npx vitest run`
Expected: no type errors; all tests pass.

---

### Task 5: Node — build and smoke-test end to end

**Files:** none (verification only)

- [ ] **Step 1: Build the Node CLI**

Run: `cd packages/cli-node && npm run build`
Expected: `[cli-node:build] done` and `dist/index.js` exists.

- [ ] **Step 2: Smoke-test the shorthand + persona line in a temp dir**

Run:
```bash
cd "$(mktemp -d)" && node /Users/vishalpatil/Study/Projects/throughspec/packages/cli-node/dist/index.js my-project --persona student --integrations caveman < /dev/null && grep "active-persona: student" my-project/spec.config.js && test -d my-project/.spec-init/base && echo SMOKE_OK
```
Expected: prints the post-init checklist, the grep matches `active-persona: student`, and `SMOKE_OK`.

- [ ] **Step 3: Smoke-test upgrade produces no spurious conflicts**

Run (in the same temp dir, from inside `my-project`):
```bash
cd my-project && node /Users/vishalpatil/Study/Projects/throughspec/packages/cli-node/dist/index.js upgrade | tee /tmp/upg.txt && grep "0 conflicts" /tmp/upg.txt && grep "active-persona: student" spec.config.js && echo UPGRADE_OK
```
Expected: `0 conflicts requiring manual resolution`, persona line still `student`, and `UPGRADE_OK`.

---

### Task 6: Python — create-app shorthand in the argv parser

**Files:**
- Modify: `packages/cli-python/src/spec_init/args.py:118-122`
- Test: `packages/cli-python/tests/test_args.py` (replace `test_unknown_command_raises`)

**Interfaces:**
- Produces: `parse_args(['my-project'])` → `CliOptions(command='init', positional=('my-project',))`.

- [ ] **Step 1: Update the failing test** — in `packages/cli-python/tests/test_args.py`, replace `test_unknown_command_raises` (lines 30-33) with:

```python
def test_implied_init() -> None:
    """A bare non-command token → implied init with that token as the name."""
    opts = parse_args(["my-project"])
    assert opts.command == "init"
    assert opts.positional == ("my-project",)


def test_leading_flag_raises() -> None:
    """A leading unknown flag is still an error, not an implied init."""
    with pytest.raises(UsageError):
        parse_args(["--nope"])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cli-python && PYTHONPATH=src python -m pytest tests/test_args.py::test_implied_init -q`
Expected: FAIL — currently raises `UsageError: unknown command`.

- [ ] **Step 3: Implement the parser change** — in `packages/cli-python/src/spec_init/args.py`, replace lines 118-122:

```python
    command_token = argv[0]
    if command_token not in COMMANDS:
        raise UsageError(
            f"unknown command: {command_token} (try one of: {', '.join(COMMANDS)})"
        )
```

with:

```python
    first = argv[0]
    if first in COMMANDS:
        command_token = first
        rest = argv[1:]
    elif first.startswith("-"):
        raise UsageError(
            f"unknown command: {first} (try one of: {', '.join(COMMANDS)})"
        )
    else:
        # Implied init: `spec-init my-project` == `spec-init init my-project`.
        command_token = "init"
        rest = argv
```

Then change the argparse call at line 136 from `ns = parser.parse_args(argv[1:])` to:

```python
        ns = parser.parse_args(rest)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/cli-python && PYTHONPATH=src python -m pytest tests/test_args.py -q`
Expected: PASS (all args tests).

---

### Task 7: Python — persona stamp helper and wiring

**Files:**
- Modify: `packages/cli-python/src/spec_init/persona.py` (append `stamp_persona`)
- Modify: `packages/cli-python/src/spec_init/commands/init.py` (stamp in write loop)
- Modify: `packages/cli-python/src/spec_init/commands/reinit.py` (stamp in write loop)
- Modify: `packages/cli-python/src/spec_init/commands/customize.py` (stamp on `--persona`)
- Test: `packages/cli-python/tests/test_customize.py` (append persona-line assertions) or `tests/test_init.py`

**Interfaces:**
- Produces: `stamp_persona(text: str, persona: str | None) -> str`.

- [ ] **Step 1: Write the failing test** — append to `packages/cli-python/tests/test_init.py`:

```python
def test_init_stamps_persona_line(scaffold) -> None:
    """init --persona student writes the active-persona line into spec.config.js."""
    project = scaffold("p", "student")
    cfg = (project / "spec.config.js").read_text(encoding="utf-8")
    assert "active-persona: student" in cfg
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cli-python && PYTHONPATH=src python -m pytest tests/test_init.py::test_init_stamps_persona_line -q`
Expected: FAIL — line still reads `active-persona: <none>`.

- [ ] **Step 3: Implement `stamp_persona`** — append to `packages/cli-python/src/spec_init/persona.py`:

```python
_ACTIVE_PERSONA_RE = re.compile(r"^// active-persona:.*$", re.MULTILINE)
_MANAGED_SUFFIX = "   // managed by spec-init - change via `spec-init customize --persona`"


def stamp_persona(text: str, persona: str | None) -> str:
    """Replace the CLI-managed `// active-persona:` line with `persona` (or `<none>`). No-op if absent."""
    line = f"// active-persona: {persona or '<none>'}{_MANAGED_SUFFIX}"
    return _ACTIVE_PERSONA_RE.sub(line, text) if _ACTIVE_PERSONA_RE.search(text) else text
```

(`re` is already imported in `persona.py`.)

- [ ] **Step 4: Wire into `init.py`** — change the import at line 17 to:

```python
from ..persona import stamp_persona, strip_personas
```

Then in the write loop (`init.py:69-70`), change:

```python
        content = _maybe_transform(rel, src.read_text(encoding="utf-8"), opts.persona, integrations)
        dest.write_text(content, encoding="utf-8", newline="")
```

to:

```python
        content = _maybe_transform(rel, src.read_text(encoding="utf-8"), opts.persona, integrations)
        if rel == "spec.config.js" and opts.persona:
            content = stamp_persona(content, opts.persona)
        dest.write_text(content, encoding="utf-8", newline="")
```

- [ ] **Step 5: Wire into `reinit.py`** — add to the imports (after the `from .init import (...)` block):

```python
from ..persona import stamp_persona
```

Then in the base-file loop (`reinit.py:75-78`), change:

```python
        content = _maybe_transform(
            rel, (payload_dir / rel).read_text(encoding="utf-8"), opts.persona, integrations
        )
        dest.write_text(content, encoding="utf-8", newline="")
```

to:

```python
        content = _maybe_transform(
            rel, (payload_dir / rel).read_text(encoding="utf-8"), opts.persona, integrations
        )
        if rel == "spec.config.js" and opts.persona:
            content = stamp_persona(content, opts.persona)
        dest.write_text(content, encoding="utf-8", newline="")
```

- [ ] **Step 6: Wire into `customize.py`** — change the import at line 11 to:

```python
from ..persona import stamp_persona, strip_personas
```

Then, immediately before the final `sys.stdout.write("[OK] customize: ...")` call (`customize.py:91`), add:

```python
    if mode == "persona" and next_persona:
        cfg = project_root / "spec.config.js"
        if cfg.exists():
            cfg.write_text(
                stamp_persona(cfg.read_text(encoding="utf-8"), next_persona),
                encoding="utf-8",
                newline="",
            )
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd packages/cli-python && PYTHONPATH=src python -m pytest tests/test_init.py tests/test_customize.py tests/test_reinit.py -q`
Expected: PASS.

---

### Task 8: Python — conflict-free upgrade (transform-on-read)

**Files:**
- Modify: `packages/cli-python/src/spec_init/commands/upgrade.py`
- Test: `packages/cli-python/tests/test_upgrade.py` (append)

**Interfaces:**
- Consumes: `_maybe_transform`, `INTEGRATIONS_PREFIX` from `.init`; `stamp_persona` from `..persona`.

- [ ] **Step 1: Write the failing test** — append to `packages/cli-python/tests/test_upgrade.py`:

```python
def test_spec_config_persona_survives_upgrade(
    scaffold: Callable, run_cli: Callable
) -> None:
    """upgrade keeps the stamped persona line and does not conflict on spec.config.js."""
    project = scaffold("p", "student")
    result = run_cli("upgrade", cwd=project)
    assert result.returncode == 0
    cfg = (project / "spec.config.js").read_text(encoding="utf-8")
    assert "active-persona: student" in cfg
    assert "<<<<<<< ours" not in cfg
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cli-python && PYTHONPATH=src python -m pytest tests/test_upgrade.py::test_spec_config_persona_survives_upgrade -q`
Expected: FAIL — the raw base still holds `active-persona: <none>` while ours holds `student`, producing a conflict (returncode 1) or a lost persona line.

- [ ] **Step 3: Add imports and a meta reader** — in `packages/cli-python/src/spec_init/commands/upgrade.py`, add `import json` at the top and, below the existing imports:

```python
from .init import INTEGRATIONS_PREFIX, _maybe_transform
from ..persona import stamp_persona
```

Then add this helper near the bottom:

```python
def _read_meta(project_root: Path) -> dict:
    """Read persona + integrations recorded at init; defaults for older/absent snapshots."""
    p = project_root / ".spec-init" / "meta.json"
    if not p.exists():
        return {"persona": None, "integrations": []}
    try:
        raw = json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"persona": None, "integrations": []}
    return {"persona": raw.get("persona"), "integrations": list(raw.get("integrations") or [])}
```

- [ ] **Step 4: Transform on read + normalize spec.config.js** — after `theirs_dir = resolve_payload_dir()` add:

```python
    meta = _read_meta(project_root)
    persona = meta["persona"]
    integrations = tuple(meta["integrations"])
```

Then replace the loop's read section (`upgrade.py:36-43`):

```python
    for rel in _walk(theirs_dir):
        base_path = base_dir / rel
        ours_path = project_root / rel
        theirs_path = theirs_dir / rel

        theirs = theirs_path.read_text(encoding="utf-8")
        base = base_path.read_text(encoding="utf-8") if base_path.exists() else ""
        ours = ours_path.read_text(encoding="utf-8") if ours_path.exists() else base
```

with:

```python
    for rel in _walk(theirs_dir):
        if rel.startswith(INTEGRATIONS_PREFIX):
            continue  # integration trees are not project-root files

        base_path = base_dir / rel
        ours_path = project_root / rel
        theirs_path = theirs_dir / rel

        theirs = _maybe_transform(rel, theirs_path.read_text(encoding="utf-8"), persona, integrations)
        base = (
            _maybe_transform(rel, base_path.read_text(encoding="utf-8"), persona, integrations)
            if base_path.exists()
            else ""
        )
        ours = ours_path.read_text(encoding="utf-8") if ours_path.exists() else base

        if rel == "spec.config.js":
            base = stamp_persona(base, None)
            theirs = stamp_persona(theirs, None)
            ours = stamp_persona(ours, None)
```

- [ ] **Step 5: Re-stamp spec.config.js after the loop** — after the snapshot-refresh block (`upgrade.py:64-67`) and before `_print_report(...)`, add:

```python
    if not opts.dry_run and persona:
        cfg = project_root / "spec.config.js"
        if cfg.exists():
            cfg.write_text(
                stamp_persona(cfg.read_text(encoding="utf-8"), persona),
                encoding="utf-8",
                newline="",
            )
```

- [ ] **Step 6: Run the full Python suite**

Run: `cd packages/cli-python && PYTHONPATH=src python -m pytest -q`
Expected: PASS (all tests, including the two new ones).

---

### Task 9: Finalize — full verification and repo memory

**Files:**
- Modify: `packages/cli-node/README.md` and/or `packages/cli-python/README.md` only if they document the exact `spec-init init <name>` invocation and should mention the shorthand (check first; skip if not present)
- Modify: `claude/context.md` (append Session History entry per repo CLAUDE.md §9)
- Modify: `CHANGELOG.md` (append under `### Fixed`)

- [ ] **Step 1: Run both suites clean**

Run: `cd packages/cli-node && npx vitest run && cd ../cli-python && PYTHONPATH=src python -m pytest -q`
Expected: all pass.

- [ ] **Step 2: Update READMEs if they show the invocation** — grep first:

Run: `grep -rn "spec-init init" packages/cli-node/README.md packages/cli-python/README.md`
If a usage/quickstart line exists, add the shorthand form `npx spec-init my-project` next to it. If not, skip this step.

- [ ] **Step 3: Append the Session History entry to `claude/context.md`** using the template at the top of that file — record: the three fixes, files touched, the transform-on-read decision (base stays raw for `customize`), and the persona-line merge-normalization mechanism.

- [ ] **Step 4: Append to `CHANGELOG.md` under `### Fixed`**:

```markdown
### Fixed
- `spec-init <name>` now scaffolds without the explicit `init` subcommand (create-app shorthand).
- `spec-init upgrade` no longer produces false conflicts on persona/integration-gated files; it transforms the raw base snapshot on read.
- The active persona is now visible in `spec.config.js` via a CLI-managed line, kept conflict-free across upgrades.
```

- [ ] **Step 5: Final self-check** — confirm `.spec-init/base/` is still raw after an upgrade (markers intact) so `customize` keeps working:

Run:
```bash
cd "$(mktemp -d)" && node /Users/vishalpatil/Study/Projects/throughspec/packages/cli-node/dist/index.js p --persona student < /dev/null >/dev/null && cd p && node /Users/vishalpatil/Study/Projects/throughspec/packages/cli-node/dist/index.js customize --persona engineer && grep "active-persona: engineer" spec.config.js && grep -q "persona:" .spec-init/base/CLAUDE.md && echo CUSTOMIZE_OK
```
Expected: `[OK] customize: ...`, the grep matches `active-persona: engineer`, base still has persona markers, and `CUSTOMIZE_OK`.

---

## Self-Review

**Spec coverage:**
- Fix 1 (shorthand): Tasks 2 (Node), 6 (Python). ✓
- Fix 2 (clean upgrade, base stays raw, transform-on-read, `_integrations/` excluded): Tasks 4 (Node), 8 (Python). ✓
- Fix 3 (persona line + writers + merge-safe upgrade): Task 1 (template line), 3 (Node writers), 7 (Python writers), 4/8 (upgrade normalize + re-stamp). ✓
- Parity across both CLIs and both payloads: Tasks 1, 5, 9 verify. ✓

**Placeholder scan:** No TBD/TODO; every code step has concrete before/after. ✓

**Type consistency:** `stampPersona`/`stamp_persona` signatures match usage in init/reinit/customize/upgrade. `readMeta`/`_read_meta` return `{persona, integrations}` consumed as `meta.persona`/`meta["persona"]`. `INTEGRATIONS_PREFIX` and `maybeTransform`/`_maybe_transform` reused from init modules. ✓

**Note on Node end-to-end:** Node has no test harness for a built payload, so upgrade/init wiring is verified by the Task 5 smoke tests plus the Python subprocess tests (Tasks 7-8) that exercise the identical logic. Node-specific pure logic (`parseArgs`, `stampPersona`) has vitest unit tests.
