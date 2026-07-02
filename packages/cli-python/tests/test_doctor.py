"""doctor: OK on fresh scaffold, fails on corrupted."""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import Callable


def test_ok_on_fresh_scaffold(scaffold: Callable, run_cli: Callable) -> None:
    """A pristine scaffold reports healthy."""
    project = scaffold("p", "engineer")
    result = run_cli("doctor", cwd=project)
    assert result.returncode == 0
    assert "healthy" in result.stdout


def test_fails_on_empty_required_file(
    scaffold: Callable, run_cli: Callable
) -> None:
    """Emptying a required file trips the size check."""
    project = scaffold("p", "engineer")
    (project / "claude" / "srs.md").write_text("", encoding="utf-8")
    result = run_cli("doctor", cwd=project)
    assert result.returncode == 1
    assert "claude/srs.md" in result.stderr


def test_fails_on_missing_snapshot(
    scaffold: Callable, run_cli: Callable, tmp_path: Path
) -> None:
    """Removing .spec-init/base trips the snapshot check."""
    project = scaffold("p", "engineer")
    shutil.rmtree(project / ".spec-init")
    result = run_cli("doctor", cwd=project)
    assert result.returncode == 1
    assert ".spec-init" in result.stderr
