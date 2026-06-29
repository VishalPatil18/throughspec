# Security Policy

## Supported Versions

Throughspec is pre-1.0. Security fixes will be applied to the latest release only until v1.0.0, after which a supported-versions matrix will be published here.

| Version | Supported   |
| ------- | ----------- |
| < 1.0   | latest only |

---

## Reporting a Vulnerability

**Please do not file a public GitHub issue for security reports.**

Email vishal18@umd.edu with:

- A description of the issue.
- Steps to reproduce or proof-of-concept.
- The affected version (or commit hash).
- Any suggested remediation.

You can expect:

- An acknowledgement within 72 hours.
- A status update within 7 days.
- A coordinated disclosure once a fix is ready, with credit if you'd like it.

---

## Scope

In scope:

- The scaffolding CLIs (`packages/cli-node`, `packages/cli-python`).
- The template payload (`templates/`).
- The companion website (`website/`).
- Any skill or agent shipped from this repository.

Out of scope:

- Vulnerabilities in third-party tools the kit recommends (Claude Code itself, Obsidian, Graphify) - report those upstream.
- Issues in projects scaffolded by Throughspec that result from user customization.

---

## Hardening Commitments

Per SRS §4.4 (NFR-SEC):

- Throughspec MUST NOT execute arbitrary remote scripts during install.
- Throughspec MUST NOT collect telemetry without explicit opt-in.
- Generated templates MUST NOT contain placeholder secrets, API keys, or tokens.
- Every release passes a security review checklist before publication.
