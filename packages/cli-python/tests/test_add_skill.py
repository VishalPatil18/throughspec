"""add-skill: name required and empty-catalog message."""

from __future__ import annotations

from pathlib import Path
from typing import Callable


def test_missing_name_refuses(tmp_path: Path, run_cli: Callable) -> None:
    """add-skill with no name → exit 2."""
    result = run_cli("add-skill", cwd=tmp_path)
    assert result.returncode == 2
    assert "requires a name" in result.stderr


def test_empty_catalog_message(tmp_path: Path, run_cli: Callable) -> None:
    """Empty catalog → helpful message and exit 2."""
    result = run_cli("add-skill", "spec-requirements", cwd=tmp_path)
    assert result.returncode == 2
    assert (
        "no skills available" in result.stderr
        or "unknown skill" in result.stderr
    )
