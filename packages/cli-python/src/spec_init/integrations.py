"""Strip integration-gated blocks; byte-parity Python port of strip-integrations.mjs."""

from __future__ import annotations

import re
from typing import Iterable

from .args import Integration

INTEGRATION_NAMES: tuple[Integration, ...] = (
    "graphify",
    "obsidian",
    "caveman",
    "agentmemory",
    "openwiki",
    "ponytail",
    "opencodereview",
)
_VALID = frozenset(INTEGRATION_NAMES)
_BLOCK_RE = re.compile(
    r"<!--\s*integration:([a-z]+)\s*-->(.*?)<!--\s*/integration:\1\s*-->\n?",
    re.DOTALL,
)


def strip_integrations(source: str, active: Iterable[Integration]) -> str:
    """Strip integration blocks; keep those whose NAME appears in `active`."""
    active_set = set(active)

    def repl(match: re.Match[str]) -> str:
        name = match.group(1)
        body = match.group(2)
        if name not in _VALID:
            raise ValueError(f"unknown integration in marker: {name}")
        return body if name in active_set else ""

    stripped = _BLOCK_RE.sub(repl, source)
    stripped = re.sub(r"<!--\s*prettier-ignore-(start|end)\s*-->\n?", "", stripped)
    stripped = re.sub(r"\n{3,}", "\n\n", stripped)
    stripped = re.sub(r"^\n+", "", stripped)
    stripped = re.sub(r"\n+$", "\n", stripped)
    return stripped
