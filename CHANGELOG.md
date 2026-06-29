# Changelog

All notable changes to Throughspec are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Stage 1 — Monorepo and source-of-truth templates layout.
  - npm workspaces root with `packages/cli-node` and `packages/cli-python`.
  - Single Node parity script (`tools/check-payload-parity.mjs`) that fails CI when the two channels' payloads diverge.
  - Lint and format baseline: ESLint 9 flat config + Prettier for Node, Ruff for Python.
  - GitHub project files: LICENSE (MIT), README, CONTRIBUTING, SECURITY, issue templates, PR template.
