"""End-to-end init tests."""

from __future__ import annotations

import time
from pathlib import Path
from typing import Callable

import pytest

from spec_init.args import INTEGRATIONS, CliOptions
from spec_init.commands.init import prompt_integrations

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
    "spec.config.js",
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
    assert not (tmp_path / "perf" / ".spec-init").exists()


def test_student_persona_strip(tmp_path: Path, run_cli: Callable) -> None:
    """--persona student keeps only the Student block."""
    run_cli("init", "p", "--persona", "student", cwd=tmp_path)
    claude = (tmp_path / "p" / "CLAUDE.md").read_text(encoding="utf-8")
    assert "For the Student" in claude
    assert "For the Vibe-Coder" not in claude
    assert "For the Solo Engineer" not in claude
    assert "For the Team Lead" not in claude


def test_integrations_flip(tmp_path: Path, run_cli: Callable) -> None:
    """--integrations graphify,obsidian keeps both integration blocks in CLAUDE.md."""
    run_cli(
        "init",
        "p",
        "--persona",
        "vibe",
        "--integrations",
        "graphify,obsidian",
        "--no-install",
        cwd=tmp_path,
    )
    claude = (tmp_path / "p" / "CLAUDE.md").read_text(encoding="utf-8")
    assert "Graphify" in claude
    assert "Obsidian" in claude
    assert "openwiki" not in claude  # an unselected integration is stripped


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


def _opts(**kw: object) -> CliOptions:
    return CliOptions(command="init", positional=("p",), **kw)  # type: ignore[arg-type]


def _queue_ask(answers: list[str]) -> Callable:
    it = iter(answers)

    def ask(_prompt: str) -> str:
        return next(it)

    return ask


def test_prompt_all_selects_every_integration() -> None:
    assert prompt_integrations(_opts(), isatty=lambda: True, ask=_queue_ask(["1"])) == INTEGRATIONS
    assert prompt_integrations(_opts(), isatty=lambda: True, ask=_queue_ask(["all"])) == INTEGRATIONS


def test_prompt_none_or_empty_selects_nothing() -> None:
    assert prompt_integrations(_opts(), isatty=lambda: True, ask=_queue_ask(["3"])) == ()
    assert prompt_integrations(_opts(), isatty=lambda: True, ask=_queue_ask([""])) == ()


def test_prompt_let_me_select_returns_subset_in_order() -> None:
    # choose "let me select", then pick caveman + graphify (out of order)
    result = prompt_integrations(_opts(), isatty=lambda: True, ask=_queue_ask(["2", "3 1"]))
    assert result == ("graphify", "caveman")


def test_prompt_gated_off_when_ineligible() -> None:
    """No prompt when non-TTY, dry-run, or integrations already chosen."""

    def boom(_p: str) -> str:
        raise AssertionError("ask must not be called")

    assert prompt_integrations(_opts(), isatty=lambda: False, ask=boom) == ()
    assert prompt_integrations(_opts(dry_run=True), isatty=lambda: True, ask=boom) == ()
    assert prompt_integrations(
        _opts(integrations=("graphify",)), isatty=lambda: True, ask=boom
    ) == ("graphify",)


def test_init_writes_persona_to_config(scaffold) -> None:
    """init --persona student writes persona into the spec.config.js managed block."""
    project = scaffold("p", "student")
    cfg = (project / "spec.config.js").read_text(encoding="utf-8")
    assert "persona: 'student'" in cfg
