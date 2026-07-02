"""Locate the templates payload shipped inside the installed package."""

from __future__ import annotations

from pathlib import Path


def resolve_payload_dir() -> Path:
    """Absolute path to the templates directory inside the installed wheel."""
    # After install: <site-packages>/spec_init/_payload
    # In editable dev mode: packages/cli-python/_payload (sibling of src/)
    here = Path(__file__).resolve().parent
    candidates = [
        here / "_payload",
        here.parent.parent / "_payload",  # editable/dev checkout
    ]
    for candidate in candidates:
        if candidate.is_dir():
            return candidate
    raise RuntimeError(
        f"spec-init: templates payload missing. Looked in: {[str(c) for c in candidates]}"
    )
