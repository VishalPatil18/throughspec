"""Copy the canonical templates/ payload into this package for build.

Run before ``uv build`` (or any ``python -m build``) so the wheel and sdist
contain the same payload the Node CLI ships. Kept pure-stdlib so the build
needs no extra dependencies.

Usage (from repo root, no install required)::

    python3 packages/cli-python/src/spec_init/_build.py

This script reads ``<repo-root>/templates/`` and writes
``packages/cli-python/_payload/``. The ``_payload`` directory is referenced
by ``pyproject.toml``'s ``force-include`` so hatchling packages it under
``spec_init/_payload`` inside the wheel. It MUST exist before ``uv sync``
or ``uv build`` because hatchling resolves ``force-include`` paths eagerly.
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path


def repo_root() -> Path:
    # packages/cli-python/src/spec_init/_build.py -> repo root is 4 levels up.
    return Path(__file__).resolve().parents[4]


def payload_src() -> Path:
    return repo_root() / "templates"


def payload_dst() -> Path:
    # packages/cli-python/_payload — sibling of src/, referenced by force-include.
    return Path(__file__).resolve().parents[2] / "_payload"


def main() -> int:
    src = payload_src()
    dst = payload_dst()

    if not src.is_dir():
        print(f"[cli-python:build] FATAL: templates/ not found at {src}", file=sys.stderr)
        return 1

    if dst.exists():
        print(f"[cli-python:build] cleaning {dst}")
        shutil.rmtree(dst)

    print(f"[cli-python:build] copying {src} -> {dst}")
    shutil.copytree(src, dst)
    print("[cli-python:build] done")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
