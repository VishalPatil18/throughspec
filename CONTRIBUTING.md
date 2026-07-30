# Contributing to Throughspec

Thanks for your interest. Throughspec is a spec-driven kit, so the contribution flow mirrors the SDLC the kit itself enforces.

---

## Before You Open a PR

1. **Read the contract.** Skim [`CLAUDE.md`](./CLAUDE.md), [`srs.md`](./srs.md), and the relevant stage in [`claude/plan.md`](./claude/plan.md). If the change does not map to a stage, open an issue first to discuss scope.
2. **Stay within stage scope.** Do not pull work from a future stage forward. Surface scope creep in the PR description rather than silently expanding the diff.
3. **No paid dependencies.** Per CLAUDE.md §7, every dependency must be zero-cost: open-source, free-tier, or run-locally.

---

## Local Setup

```bash
git clone https://github.com/<owner>/throughspec.git
cd throughspec
npm install
cd packages/cli-python && uv sync && cd ../..
```

---

## Quality Gates

Every PR must pass:

```bash
npm run lint            # ESLint
npm run lint:py         # Ruff
npm run format:check    # Prettier
npm test                # Vitest
npm run build && npm run build:python && npm run check-parity
```

Stage 1 ships only the skeleton, so the test surface is small. As stages land, tests are mandatory for every new behavior (SRS §3.6 FR-CODE-03).

---

## Publishing the packages

### Node - npm (packages/cli-node)

```bash
cd /Users/vishalpatil/Study/Projects/throughspec

npm login                    # once per machine (or set NODE_AUTH_TOKEN)
npm install                  # ensure deps (build runs automatically on publish)

# Preview exactly what ships (no upload):
npm publish -w packages/cli-node --dry-run

# Publish (prepublishOnly builds cli-node first):
npm publish -w packages/cli-node --access public

# Verify the newly published version
npm view spec-init version
```

### Python - PyPI (packages/cli-python)

```bash
cd /Users/vishalpatil/Study/Projects/throughspec

# 1. Refresh the generated payload
rm -rf packages/cli-python/_payload
cp -R templates packages/cli-python/_payload

# 2. Build wheel + sdist
cd packages/cli-python
rm -rf dist
uv build

# 3. Publish with your PyPI API token
uv publish --token pypi-XXXXXXXX

# 4. Verify the newly published version
pip index versions spec-init
```

---

## Commit Style

- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Keep commits small and focused. One concern per commit.
- Reference the SRS section or plan stage when relevant: `feat(stage-3): add init command`.

---

## Pull Request Checklist

- [ ] Change traces to a specific stage in `claude/plan.md` or to an explicitly approved out-of-band issue.
- [ ] Tests added or updated.
- [ ] Lint, format, parity, and build all pass locally.
- [ ] No new paid dependencies.
- [ ] No edits to `templates/` content unless the PR is part of Stage 2 or a later content stage.
- [ ] `CHANGELOG.md` updated.
- [ ] Docs updated if user-facing behavior changed.

---

## Code of Conduct

Be kind. Assume good faith. Disagree with ideas, not people.

---

## Reporting Security Issues

See [`SECURITY.md`](./SECURITY.md). Do not file public issues for vulnerabilities.
