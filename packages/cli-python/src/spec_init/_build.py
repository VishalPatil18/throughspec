"""Copy templates/ into packages/cli-python/_payload/ so the wheel ships the same payload."""

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
    # packages/cli-python/_payload - sibling of src/, referenced by force-include.
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
