# ponytail - code-minimalism discipline

This project opted into [ponytail](https://github.com/DietrichGebert/ponytail),
an AI-agent minimalism ruleset. It makes the agent "think like the laziest
senior dev in the room" - the best code is the code you never wrote. Lazy here
means efficient, not careless: the agent still reads and reasons fully, then
writes the least code that solves the problem.

## Install (once, per machine)

ponytail is a Claude Code plugin, not code checked into this project. Install it
as **two separate prompts** in Claude Code:

```text
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

Free, local, open-source. Default intensity lives in
`~/.config/ponytail/config.json` or the `PONYTAIL_DEFAULT_MODE` env var.

## The ladder (runs before writing any code)

Stop at the first rung that holds:

1. Does this need to exist at all? Speculative need -> skip it (YAGNI).
2. Already in this codebase? Reuse the helper/util/pattern.
3. Does the standard library do it? Use it.
4. Native platform feature? Use it (CSS over JS, a DB constraint over app code).
5. Already-installed dependency solves it? Use it - do not add a new one.
6. Can it be one line? One line.
7. Only then: the minimum code that works.

## Modes and commands

| Command                                    | Purpose                                    |
| ------------------------------------------ | ------------------------------------------ |
| `/ponytail [lite \| full \| ultra \| off]` | Set minimalism intensity (default `full`)  |
| `/ponytail-review`                         | Flag over-engineering in the current diff  |
| `/ponytail-audit`                          | Scan the whole repo for complexity to cut  |
| `/ponytail-debt`                           | Collect deliberate shortcuts into a ledger |

## What ponytail never simplifies away

Understanding the problem, input validation at trust boundaries, error handling
that prevents data loss, security, accessibility basics, or anything the user
explicitly asked for. It shortens the solution, never the reading.

## How it fits this project

ponytail is a natural complement to the Spec-Driven workflow: it enforces at
code-generation time the same restraint that `/spec-refactor`,
`/spec-code-quality`, and `/spec-simplify` enforce at review time. Let the spec
define what to build; let ponytail keep the implementation to the smallest thing
that satisfies it. When ponytail and the SRS disagree, the SRS wins - ponytail
trims scope creep, not required scope.
