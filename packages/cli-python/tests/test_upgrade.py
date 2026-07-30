"""upgrade: managed-region model preserves user data and refreshes managed regions."""

from __future__ import annotations

from pathlib import Path
from typing import Callable


def test_preserves_user_data(scaffold: Callable, run_cli: Callable) -> None:
    """User-owned data files are never overwritten by upgrade."""
    project = scaffold("p", "engineer", "--no-install")
    (project / "claude" / "context.md").write_text("MY DATA\n", encoding="utf-8")
    result = run_cli("upgrade", cwd=project)
    assert result.returncode == 0, result.stderr
    assert (project / "claude" / "context.md").read_text(encoding="utf-8") == "MY DATA\n"


def test_no_config_refuses(tmp_path: Path, run_cli: Callable) -> None:
    """upgrade outside a Throughspec project (no spec.config.js) → exit 2."""
    result = run_cli("upgrade", cwd=tmp_path)
    assert result.returncode == 2
    assert "spec.config.js" in result.stderr


def test_refreshes_managed_region(scaffold: Callable, run_cli: Callable) -> None:
    """A tampered CLI-managed region of CLAUDE.md is restored from the template."""
    project = scaffold("p", "engineer", "--no-install")
    claude = project / "CLAUDE.md"
    tampered = claude.read_text(encoding="utf-8").replace(
        "This project follows the **Spec-Driven Development** SDLC.", "TAMPERED"
    )
    claude.write_text(tampered, encoding="utf-8")
    result = run_cli("upgrade", cwd=project)
    assert result.returncode == 0, result.stderr
    out = claude.read_text(encoding="utf-8")
    assert "TAMPERED" not in out
    assert "Spec-Driven Development" in out


def test_preserves_claude_user_section(scaffold: Callable, run_cli: Callable) -> None:
    """Edits outside the managed markers (product summary) survive upgrade."""
    project = scaffold("p", "engineer", "--no-install")
    claude = project / "CLAUDE.md"
    edited = claude.read_text(encoding="utf-8").replace(
        "<one-line product name and pitch>", "MY PITCH"
    )
    claude.write_text(edited, encoding="utf-8")
    run_cli("upgrade", cwd=project)
    assert "MY PITCH" in claude.read_text(encoding="utf-8")


def test_migrates_legacy_spec_init(scaffold: Callable, run_cli: Callable) -> None:
    """A leftover .spec-init/ (pre-1.2) is migrated away on upgrade."""
    project = scaffold("p", "team", "--no-install")
    (project / ".spec-init").mkdir()
    (project / ".spec-init" / "meta.json").write_text(
        '{"persona":"team","integrations":[]}', encoding="utf-8"
    )
    result = run_cli("upgrade", cwd=project)
    assert result.returncode == 0, result.stderr
    assert not (project / ".spec-init").exists()
