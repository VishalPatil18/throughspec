# Open Code Review - AI code-review CLI

This project opted into [Open Code Review](https://github.com/alibaba/open-code-review),
an AI-powered code-review CLI (`ocr`, Apache-2.0). It reviews Git diffs and
whole files with line-level findings, using a hybrid of deterministic diff
analysis and an LLM so coverage stays complete and comments land on the right
lines. It complements this project's in-session `/spec-review` skill: use
`/spec-review` while working, and `ocr` for pre-push and CI checks.

## Install (once, per machine)

`ocr` is a globally installed tool, not code checked into this project. Requires
Git >= 2.41.

```sh
npm install -g @alibaba-group/open-code-review
```

Alternative installers (script, release binary, from source) are documented in
the repo.

## Configure a model

`ocr` needs an LLM provider (OpenAI/Anthropic-compatible endpoint):

```sh
ocr config provider   # select provider
ocr config model      # choose model
```

Configuration is interactive or via environment variables.

## Zero-cost path: delegate to your coding agent

To avoid a separate paid API key, use delegation - `ocr` reuses the LLM of the
coding agent you already run:

```sh
ocr delegate preview
```

## Everyday commands

| Command                                | Purpose                                     |
| -------------------------------------- | ------------------------------------------- |
| `ocr review`                           | Review staged + unstaged changes            |
| `ocr review --from main --to <branch>` | Review the diff between two branches        |
| `ocr scan`                             | Review whole files/directories (audit mode) |

## How it fits this project

- **Pre-push gate.** Run `ocr review` before committing or opening a PR so the
  AI reviewer catches line-level issues while the change is small.
- **CI.** Wire `ocr` into a GitHub Action or GitLab CI job for automated review
  on every PR - the same findings, without anyone pushing a button.
- **Not a replacement for the spec.** `ocr` reviews the code; `claude/srs.md`
  and the memory layer remain the source of truth for what the code should do.
  Treat its findings as input to `/spec-bug` or `/spec-refactor`, not as edits
  to apply blindly.
