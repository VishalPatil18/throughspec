"""Three-way text merge with git-style conflict markers.

Wraps merge3.Merge3 to produce the same `<<<<<<< ours` / `>>>>>>> theirs`
fences the Node CLI emits (via node-diff3), so the two channels present
identical conflict output to users.
"""

from __future__ import annotations

from dataclasses import dataclass

import merge3


@dataclass(frozen=True)
class MergeResult:
    """Return shape for `three_way_merge`."""

    merged: str
    has_conflict: bool


def three_way_merge(base: str, ours: str, theirs: str) -> MergeResult:
    """Merge `ours` and `theirs` against a common `base`."""
    m3 = merge3.Merge3(
        base.splitlines(keepends=True),
        ours.splitlines(keepends=True),
        theirs.splitlines(keepends=True),
    )
    chunks: list[str] = []
    has_conflict = False
    for group in m3.merge_groups():
        tag = group[0]
        if tag == "unchanged":
            chunks.extend(group[1])
        elif tag in ("a", "same"):
            chunks.extend(group[1])
        elif tag == "b":
            chunks.extend(group[1])
        elif tag == "conflict":
            has_conflict = True
            _, _base_lines, a_lines, b_lines = group
            chunks.append("<<<<<<< ours\n")
            chunks.extend(a_lines)
            if chunks and not chunks[-1].endswith("\n"):
                chunks.append("\n")
            chunks.append("=======\n")
            chunks.extend(b_lines)
            if chunks and not chunks[-1].endswith("\n"):
                chunks.append("\n")
            chunks.append(">>>>>>> theirs\n")
    return MergeResult(merged="".join(chunks), has_conflict=has_conflict)
