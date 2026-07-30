"""spec-init doctor - verify a scaffolded project's shape."""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

REQUIRED_FILES = (
    "CLAUDE.md",
    "README.md",
    "CHANGELOG.md",
    "SECURITY.md",
    "CONTRIBUTING.md",
    "claude/srs.md",
    "claude/plan.md",
    "claude/context.md",
    "claude/features.md",
    "claude/design-decisions.md",
    "claude/learnings.md",
    "design/design.md",
)


@dataclass
class DoctorReport:
    """Health summary produced by `run_doctor`."""

    ok: bool = True
    issues: list[str] = field(default_factory=list)


def run_doctor(cwd: Path | None = None) -> DoctorReport:
    """Check a scaffolded project for missing files, empty files, and misuse."""
    root = (cwd or Path.cwd()).resolve()
    issues: list[str] = []

    for rel in REQUIRED_FILES:
        path = root / rel
        if not path.exists():
            issues.append(f"missing required file: {rel}")
            continue
        if path.stat().st_size == 0:
            issues.append(f"required file is empty: {rel}")

    claude_md = root / "CLAUDE.md"
    if claude_md.exists():
        text = claude_md.read_text(encoding="utf-8")
        if not re.search(r"Template version", text, re.IGNORECASE):
            issues.append('CLAUDE.md is missing the "Template version" line')

    config = root / "spec.config.js"
    if not config.exists():
        issues.append("missing spec.config.js (project config)")
    elif not re.search(r"persona:\s*['\"]", config.read_text(encoding="utf-8")):
        issues.append("spec.config.js is missing the managed persona field")

    report = DoctorReport(ok=not issues, issues=issues)
    if report.ok:
        sys.stdout.write("[OK] project looks healthy\n")
    else:
        sys.stderr.write(f"spec-init doctor: {len(issues)} issue(s)\n")
        for line in issues:
            sys.stderr.write(f"  - {line}\n")
    return report
