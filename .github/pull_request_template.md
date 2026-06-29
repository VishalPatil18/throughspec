<!-- Throughspec PR template - keep it tight, follow the kit's own spec-driven contract. -->

## What

<!-- One paragraph: what this PR changes and why. -->

## Stage

<!-- Reference the stage in claude/plan.md this PR advances, e.g., "Stage 3 - Node CLI". -->

Stage:

## Scope Check

- [ ] Change traces directly to the named stage or an approved issue.
- [ ] No work pulled from a future stage.
- [ ] No edits to `templates/` content unless this PR is part of a content stage.
- [ ] No new paid dependencies (CLAUDE.md §7).

## Quality Gates

- [ ] `npm run lint` passes
- [ ] `npm run lint:py` passes
- [ ] `npm run format:check` passes
- [ ] `npm test` passes
- [ ] `npm run build && npm run build:python && npm run check-parity` all pass

## Tests

<!-- What did you add or change? Why is the coverage sufficient? -->

## Docs

- [ ] `README.md` updated (if user-facing behavior changed)
- [ ] `CHANGELOG.md` updated
- [ ] `claude/plan.md` checkboxes updated for completed work

## Notes for Reviewer

<!-- Anything non-obvious, tradeoffs considered, things deliberately left out. -->
