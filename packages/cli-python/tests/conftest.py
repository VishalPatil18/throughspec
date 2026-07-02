"""Shared pytest fixtures for the Python CLI."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from typing import Callable

import pytest

PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PACKAGE_ROOT.parent.parent


@pytest.fixture
def cli_env() -> dict[str, str]:
    """Environment for invoking `python -m spec_init` in a subprocess."""
    env = os.environ.copy()
    # Point PYTHONPATH at the package src/ so the subprocess resolves the module.
    env["PYTHONPATH"] = str(PACKAGE_ROOT / "src")
    return env


@pytest.fixture
def run_cli(cli_env: dict[str, str]) -> Callable[..., subprocess.CompletedProcess[str]]:
    """Callable that runs `python -m spec_init <args>` in a given cwd."""

    def _run(*args: str, cwd: Path | str | None = None) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, "-m", "spec_init", *args],
            capture_output=True,
            text=True,
            env=cli_env,
            cwd=str(cwd) if cwd else None,
            check=False,
        )

    return _run


@pytest.fixture
def scaffold(
    tmp_path: Path,
    run_cli: Callable[..., subprocess.CompletedProcess[str]],
) -> Callable[..., Path]:
    """Callable that scaffolds a project into tmp_path/name and returns the project dir."""

    def _scaffold(name: str = "p", persona: str = "engineer", *extra: str) -> Path:
        result = run_cli(
            "init", name, "--persona", persona, *extra, cwd=tmp_path
        )
        assert result.returncode == 0, f"init failed: {result.stderr}"
        return tmp_path / name

    return _scaffold
