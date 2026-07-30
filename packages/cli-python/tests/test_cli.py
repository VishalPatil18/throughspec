"""CLI dispatch behaviors (version flag)."""

from __future__ import annotations

from typing import Callable


def test_version_flag_prints_version(run_cli: Callable) -> None:
    """`spec-init --version` prints the version line, not the help text (regression).

    Regression for a dispatch-order bug where the help/`command is None` branch
    ran before the version check, so `--version` (which parses to command=None)
    printed HELP_TEXT and exited 2 instead of the version.
    """
    result = run_cli("--version")
    assert result.returncode == 0, result.stdout + result.stderr
    assert result.stdout.startswith("spec-init ")
    assert "USAGE" not in result.stdout


def test_version_short_flag_prints_version(run_cli: Callable) -> None:
    """`spec-init -v` behaves the same as `--version`."""
    result = run_cli("-v")
    assert result.returncode == 0, result.stdout + result.stderr
    assert result.stdout.startswith("spec-init ")
    assert "USAGE" not in result.stdout
