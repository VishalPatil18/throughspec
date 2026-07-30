"""Managed-region model + file classes (mirrors cli-node/src/managed-region.ts).

upgrade rewrites only CLI-owned regions of a mixed file (CLAUDE.md), never the
user's content around them. File classes decide per-path whether upgrade
replaces, preserves, or region-swaps a file.
"""

from __future__ import annotations

import re

MANAGED_START = "<!-- throughspec:managed:start -->"
MANAGED_END = "<!-- throughspec:managed:end -->"

_REGION_RE = re.compile(
    r"<!-- throughspec:managed:start -->.*?<!-- throughspec:managed:end -->",
    re.DOTALL,
)

# User-owned data: never overwritten by upgrade (written only if missing).
_PRESERVE = frozenset(
    {
        "claude/context.md",
        "claude/srs.md",
        "claude/plan.md",
        "claude/features.md",
        "claude/design-decisions.md",
        "claude/learnings.md",
        "design/design.md",
        "CHANGELOG.md",
        "README.md",
        "spec.config.js",
    }
)
# Mixed files: CLI instructions inside markers, user data outside.
_MANAGED = frozenset({"CLAUDE.md"})


def classify(rel: str) -> str:
    """Classify a payload-relative path: 'preserve' | 'managed' | 'replace'."""
    if rel in _PRESERVE:
        return "preserve"
    if rel in _MANAGED:
        return "managed"
    return "replace"


def count_regions(text: str) -> int:
    """Count the managed regions in a file."""
    return len(_REGION_RE.findall(text))


def swap_managed_regions(ours: str, theirs: str) -> str | None:
    """Return `ours` with each managed region replaced by `theirs`' region at the
    same position. None when the region counts differ - the caller then preserves
    `ours` rather than risk losing user content."""
    ours_regions = _REGION_RE.findall(ours)
    theirs_regions = _REGION_RE.findall(theirs)
    if not ours_regions or len(ours_regions) != len(theirs_regions):
        return None
    it = iter(theirs_regions)
    return _REGION_RE.sub(lambda _m: next(it), ours)
