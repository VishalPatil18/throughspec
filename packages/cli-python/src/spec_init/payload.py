"""Locate the templates payload shipped inside the installed package."""

from __future__ import annotations

from pathlib import Path


def resolve_payload_dir() -> Path:
    """Absolute path to the templates directory inside the installed wheel."""
    here = Path(__file__).resolve().parent
    # Prefer the editable dev _payload/ (live, rebuildable) over the installed-wheel copy.
    candidates = [
        here.parent.parent / "_payload",  # editable/dev checkout
        here / "_payload",  # installed wheel
    ]
    for candidate in candidates:
        if candidate.is_dir():
            return candidate
    raise RuntimeError(
        f"spec-init: templates payload missing. Looked in: {[str(c) for c in candidates]}"
    )
