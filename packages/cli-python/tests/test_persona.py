"""Persona-strip parity vs tools/strip-personas.mjs."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

import pytest

from spec_init.persona import strip_personas

REPO_ROOT = Path(__file__).resolve().parents[3]
CLAUDE_MD = REPO_ROOT / "templates" / "CLAUDE.md"
STRIP_MJS = REPO_ROOT / "tools" / "strip-personas.mjs"
PERSONAS = ("vibe", "student", "engineer", "team")


def _has_node() -> bool:
    """Return True when a `node` binary is available."""
    return shutil.which("node") is not None


@pytest.mark.skipif(not _has_node(), reason="node not installed; skipping parity test")
@pytest.mark.parametrize("persona", PERSONAS)
def test_python_matches_mjs(persona: str, tmp_path: Path) -> None:
    """Python strip output matches the .mjs source byte-for-byte."""
    py_out = strip_personas(CLAUDE_MD.read_text(encoding="utf-8"), persona)  # type: ignore[arg-type]
    mjs_result = subprocess.run(
        [
            "node",
            str(STRIP_MJS),
            "--persona",
            persona,
            "--in",
            str(CLAUDE_MD),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    assert py_out == mjs_result.stdout


def test_unknown_persona_raises() -> None:
    """Unknown persona → ValueError."""
    with pytest.raises(ValueError, match="unknown persona"):
        strip_personas("<!-- persona:vibe -->x<!-- /persona:vibe -->", "ghost")  # type: ignore[arg-type]


def test_unmarked_content_retained() -> None:
    """Content outside markers is retained verbatim for every persona."""
    source = CLAUDE_MD.read_text(encoding="utf-8")
    for persona in PERSONAS:
        stripped = strip_personas(source, persona)  # type: ignore[arg-type]
        assert "## 9. Quick links" in stripped
        assert "Template version" in stripped
