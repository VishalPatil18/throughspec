"""spec-init reinit: adopting Throughspec into an existing project in place."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from spec_init.args import CliOptions
from spec_init.commands.reinit import resolve_reinit_mode


def _run_cli(cwd: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-m", "spec_init", *args],
        cwd=str(cwd),
        capture_output=True,
        text=True,
    )


def _existing_project(tmp_path: Path) -> Path:
    project = tmp_path / "legacy"
    project.mkdir()
    (project / "app.py").write_text("print(1)\n", encoding="utf-8")
    return project


def test_keeps_existing_and_leaves_source_untouched(tmp_path: Path) -> None:
    project = _existing_project(tmp_path)
    (project / "CLAUDE.md").write_text("MY OWN CONTRACT\n", encoding="utf-8")

    r = _run_cli(project, "reinit", "--persona", "engineer")
    assert r.returncode == 0, r.stderr
    assert (project / "CLAUDE.md").read_text(encoding="utf-8") == "MY OWN CONTRACT\n"
    assert (project / "app.py").read_text(encoding="utf-8") == "print(1)\n"
    assert (project / "claude" / "srs.md").exists()
    assert (project / ".spec-init" / "base" / "CLAUDE.md").exists()
    assert (project / ".spec-init" / "meta.json").exists()
    assert "1 kept" in r.stdout


def test_force_replaces_existing_spec_files(tmp_path: Path) -> None:
    project = _existing_project(tmp_path)
    (project / "CLAUDE.md").write_text("MY OWN CONTRACT\n", encoding="utf-8")

    r = _run_cli(project, "reinit", "--persona", "engineer", "--force")
    assert r.returncode == 0, r.stderr
    assert "CLAUDE.md - Project Behavior Contract" in (project / "CLAUDE.md").read_text(
        encoding="utf-8"
    )
    assert "0 kept" in r.stdout


def test_writes_full_payload_when_no_spec_files(tmp_path: Path) -> None:
    project = _existing_project(tmp_path)
    r = _run_cli(project, "reinit", "--persona", "engineer")
    assert r.returncode == 0, r.stderr
    assert (project / "CLAUDE.md").exists()
    assert (project / "claude" / "context.md").exists()


def test_refuses_when_already_managed(tmp_path: Path) -> None:
    project = _existing_project(tmp_path)
    _run_cli(project, "reinit", "--persona", "engineer")
    again = _run_cli(project, "reinit")
    assert again.returncode == 2
    assert "already has a .spec-init/base snapshot" in again.stderr


def test_dry_run_writes_nothing(tmp_path: Path) -> None:
    project = _existing_project(tmp_path)
    r = _run_cli(project, "reinit", "--dry-run")
    assert r.returncode == 0
    assert "[dry-run]" in r.stdout
    assert not (project / "CLAUDE.md").exists()
    assert not (project / ".spec-init").exists()


def _opts(**kw: object) -> CliOptions:
    return CliOptions(command="reinit", **kw)  # type: ignore[arg-type]


def test_resolve_mode_force_always_replaces() -> None:
    def boom(_p: str) -> str:
        raise AssertionError("ask must not be called")

    assert resolve_reinit_mode(_opts(force=True), 5, isatty=lambda: True, ask=boom) == "replace"


def test_resolve_mode_no_existing_replaces() -> None:
    def boom(_p: str) -> str:
        raise AssertionError("ask must not be called")

    assert resolve_reinit_mode(_opts(), 0, isatty=lambda: True, ask=boom) == "replace"


def test_resolve_mode_non_interactive_keeps() -> None:
    def boom(_p: str) -> str:
        raise AssertionError("ask must not be called")

    assert resolve_reinit_mode(_opts(), 3, isatty=lambda: False, ask=boom) == "keep"
    assert resolve_reinit_mode(_opts(dry_run=True), 3, isatty=lambda: True, ask=boom) == "keep"


def test_resolve_mode_interactive_answer() -> None:
    assert resolve_reinit_mode(_opts(), 3, isatty=lambda: True, ask=lambda _p: "replace") == "replace"
    assert resolve_reinit_mode(_opts(), 3, isatty=lambda: True, ask=lambda _p: "r") == "replace"
    assert resolve_reinit_mode(_opts(), 3, isatty=lambda: True, ask=lambda _p: "") == "keep"
    assert resolve_reinit_mode(_opts(), 3, isatty=lambda: True, ask=lambda _p: "keep") == "keep"
