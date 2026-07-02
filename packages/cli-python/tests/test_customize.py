"""customize: integration flip + persona swap."""

from __future__ import annotations

from pathlib import Path
from typing import Callable


def test_add_graphify_flips_checkbox(
    scaffold: Callable, run_cli: Callable
) -> None:
    """--add graphify writes `[x] Graphify` into section 8."""
    project = scaffold("p", "engineer")
    result = run_cli("customize", "--add", "graphify", cwd=project)
    assert result.returncode == 0
    assert "- [x] Graphify" in (project / "CLAUDE.md").read_text(encoding="utf-8")


def test_remove_obsidian_restores_checkbox(
    scaffold: Callable, run_cli: Callable
) -> None:
    """After --add + --remove, the checkbox is back to `[ ]`."""
    project = scaffold("p", "engineer")
    run_cli("customize", "--add", "obsidian", cwd=project)
    result = run_cli("customize", "--remove", "obsidian", cwd=project)
    assert result.returncode == 0
    assert "- [ ] Obsidian" in (project / "CLAUDE.md").read_text(encoding="utf-8")


def test_persona_swap(scaffold: Callable, run_cli: Callable) -> None:
    """--persona student swaps the surviving CLAUDE.md block."""
    project = scaffold("p", "engineer")
    result = run_cli("customize", "--persona", "student", cwd=project)
    assert result.returncode == 0
    claude = (project / "CLAUDE.md").read_text(encoding="utf-8")
    assert "For the Student" in claude
    assert "For the Solo Engineer" not in claude


def test_no_action_flag_refuses(
    scaffold: Callable, run_cli: Callable
) -> None:
    """customize with no action flag → exit 2."""
    project = scaffold("p", "engineer")
    result = run_cli("customize", cwd=project)
    assert result.returncode == 2


def test_outside_project_refuses(
    tmp_path: Path, run_cli: Callable
) -> None:
    """customize outside a scaffolded project → exit 2."""
    result = run_cli("customize", "--add", "graphify", cwd=tmp_path)
    assert result.returncode == 2
    assert "CLAUDE.md not found" in result.stderr
