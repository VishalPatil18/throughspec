"""Strip persona-gated blocks; byte-parity Python port of strip-personas.mjs."""

from __future__ import annotations

import re

from .args import Persona

_VALID: frozenset[str] = frozenset({"vibe", "student", "engineer", "team"})

_BLOCK_RE = re.compile(
    r"<!--\s*persona:([a-z,\s]+)\s*-->([\s\S]*?)<!--\s*/persona:\1\s*-->\n?"
)


def strip_personas(source: str, persona: Persona) -> str:
    """Strip persona-gated blocks from `source`, keeping only those matching `persona`."""
    if persona not in _VALID:
        raise ValueError(f"unknown persona: {persona}")

    def _replace(match: re.Match[str]) -> str:
        names_raw = match.group(1)
        body = match.group(2)
        names = [n.strip() for n in names_raw.split(",") if n.strip()]
        for name in names:
            if name not in _VALID:
                raise ValueError(f"unknown persona in marker: {names_raw.strip()}")
        return body if persona in names else ""

    stripped = _BLOCK_RE.sub(_replace, source)
    # Collapse 3+ newlines left by removed blocks; end with one trailing newline.
    stripped = re.sub(r"\n{3,}", "\n\n", stripped)
    stripped = re.sub(r"\n+$", "\n", stripped)
    return stripped
