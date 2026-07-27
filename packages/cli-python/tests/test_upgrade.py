"""upgrade: three-way merge behaviors."""

from __future__ import annotations

from pathlib import Path
from typing import Callable


def _fake_history(project: Path, rel: str, base: str, ours: str) -> None:
    """Rewrite base+ours to simulate a prior template version and a user edit."""
    (project / ".spec-init" / "base" / rel).write_text(base, encoding="utf-8")
    (project / rel).write_text(ours, encoding="utf-8")


def test_dry_run_unedited_file(
    scaffold: Callable, run_cli: Callable
) -> None:
    """base == ours (unedited) is silently taken from theirs."""
    project = scaffold("p", "engineer")
    _fake_history(project, "CHANGELOG.md", "old\n", "old\n")
    result = run_cli("upgrade", "--dry-run", cwd=project)
    assert result.returncode == 0
    assert "taken from new template" in result.stdout
    assert "0 conflicts" in result.stdout


def test_no_snapshot_refuses(tmp_path: Path, run_cli: Callable) -> None:
    """upgrade with no .spec-init/base → exit 2."""
    result = run_cli("upgrade", cwd=tmp_path)
    assert result.returncode == 2
    assert ".spec-init/base" in result.stderr


def test_conflict_produces_markers(
    scaffold: Callable, run_cli: Callable
) -> None:
    """Diverging edits on the same lines produce git-style conflict markers."""
    project = scaffold("p", "engineer")
    _fake_history(project, "README.md", "line1\nline2\n", "line1\nuser-edit\n")
    result = run_cli("upgrade", cwd=project)
    assert result.returncode in (0, 1)
    if result.returncode == 1:
        readme = (project / "README.md").read_text(encoding="utf-8")
        assert "<<<<<<< ours" in readme
        assert ">>>>>>> theirs" in readme


def test_upgrade_no_false_conflict_on_stripped_persona_block(
    scaffold: Callable, run_cli: Callable
) -> None:
    """A template change inside a persona block the user's persona stripped must
    not resurface as a conflict after the transform-on-read upgrade.

    Without the fix, the raw base snapshot still contains the engineer block
    while ours (student) deleted it; a difference inside that block makes the
    three-way merge see an overlapping change and emit a conflict. With the fix,
    base and theirs are stripped on read so the engineer change vanishes and the
    upgrade is clean.
    """
    project = scaffold("p", "student")
    base_claude = project / ".spec-init" / "base" / "CLAUDE.md"
    text = base_claude.read_text(encoding="utf-8")
    # Sanity: the RAW base snapshot contains the engineer-persona block that the
    # student-stripped working CLAUDE.md does not.
    assert "For the Solo Engineer" in text
    assert "For the Solo Engineer" not in (project / "CLAUDE.md").read_text(encoding="utf-8")
    # Simulate a prior template version whose engineer block differed, so
    # base != theirs INSIDE a region ours deleted.
    base_claude.write_text(
        text.replace("For the Solo Engineer", "For the Solo Engineer (old)"),
        encoding="utf-8",
    )

    result = run_cli("upgrade", cwd=project)
    ours = (project / "CLAUDE.md").read_text(encoding="utf-8")
    assert result.returncode == 0, result.stdout + result.stderr
    assert "<<<<<<< ours" not in ours  # no conflict markers
    assert "For the Solo Engineer" not in ours  # stripped block not resurrected
