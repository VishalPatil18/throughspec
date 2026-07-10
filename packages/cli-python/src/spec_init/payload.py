"""Locate the templates payload shipped inside the installed package."""

from __future__ import annotations

from pathlib import Path


def resolve_payload_dir() -> Path:
    """Absolute path to the templates directory inside the installed wheel."""
    here = Path(__file__).resolve().parent
    # In editable dev mode the source _payload/ at packages/cli-python/_payload/
    # is the live tree that `python -m spec_init._build` refreshes. Prefer it so
    # rebuilds land immediately without touching site-packages.
    #
    # After a wheel install the sibling _payload/ next to __init__.py is the only
    # available copy and the dev-mode candidate does not exist.
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
