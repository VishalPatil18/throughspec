"""End-to-end init tests."""

from __future__ import annotations

import time
from pathlib import Path
from typing import Callable

import pytest

REQUIRED = [
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
    ".github/pull_request_template.md",
    ".github/ISSUE_TEMPLATE/bug_report.md",
    ".github/ISSUE_TEMPLATE/feature_request.md",
]


def test_produces_srs_tree_under_5s(tmp_path: Path, run_cli: Callable) -> None:
    """Full SRS §6 tree scaffolds in < 5 seconds."""
    t0 = time.perf_counter()
    result = run_cli("init", "perf", "--persona", "engineer", cwd=tmp_path)
    elapsed = time.perf_counter() - t0
    assert result.returncode == 0, result.stderr
    assert elapsed < 5.0, f"scaffold took {elapsed:.2f}s"
    for rel in REQUIRED:
        assert (tmp_path / "perf" / rel).exists(), rel
    assert (tmp_path / "perf" / ".spec-init" / "base" / "CLAUDE.md").exists()


def test_student_persona_strip(tmp_path: Path, run_cli: Callable) -> None:
    """--persona student keeps only the Student block."""
    run_cli("init", "p", "--persona", "student", cwd=tmp_path)
    claude = (tmp_path / "p" / "CLAUDE.md").read_text(encoding="utf-8")
    assert "For the Student" in claude
    assert "For the Vibe-Coder" not in claude
    assert "For the Solo Engineer" not in claude
    assert "For the Team Lead" not in claude


def test_integrations_flip(tmp_path: Path, run_cli: Callable) -> None:
    """--integrations graphify,obsidian flips both checkboxes to [x]."""
    run_cli(
        "init",
        "p",
        "--persona",
        "vibe",
        "--integrations",
        "graphify,obsidian",
        cwd=tmp_path,
    )
    claude = (tmp_path / "p" / "CLAUDE.md").read_text(encoding="utf-8")
    assert "- [x] Graphify" in claude
    assert "- [x] Obsidian" in claude


def test_refuse_without_force(
    tmp_path: Path, scaffold: Callable, run_cli: Callable
) -> None:
    """init against a non-empty dir exits 2 without --force."""
    scaffold("p", "engineer")
    retry = run_cli("init", "p", cwd=tmp_path)
    assert retry.returncode == 2
    forced = run_cli("init", "p", "--force", cwd=tmp_path)
    assert forced.returncode == 0


def test_dry_run_writes_nothing(tmp_path: Path, run_cli: Callable) -> None:
    """--dry-run prints the plan; nothing appears on disk."""
    result = run_cli("init", "p", "--dry-run", cwd=tmp_path)
    assert result.returncode == 0
    assert not (tmp_path / "p").exists()
