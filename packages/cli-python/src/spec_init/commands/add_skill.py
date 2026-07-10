"""spec-init add-skill <name>.

Copies a skill definition from the payload's skills/ catalog into the
project's .claude/skills/ directory. Stage 5 populates the catalog.
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

from ..args import CliOptions, UsageError
from ..payload import resolve_payload_dir


def run_add_skill(opts: CliOptions) -> None:
    """Copy a skill from the payload catalog. Raises UsageError on refusals."""
    if not opts.positional:
        raise UsageError("add-skill requires a name: spec-init add-skill <name>")
    name = opts.positional[0]

    payload_root = resolve_payload_dir().parent
    catalog = payload_root / "skills"
    available = sorted(p.name for p in catalog.iterdir()) if catalog.exists() else []

    if not available:
        sys.stderr.write(
            "spec-init: no skills available in this payload (populated in Stage 5).\n"
        )
        raise UsageError(f"add-skill: unknown skill '{name}'")

    source = catalog / name
    if not source.exists():
        raise UsageError(
            f"add-skill: unknown skill '{name}' (available: {', '.join(available)})"
        )

    dest = Path.cwd() / ".claude" / "skills" / name
    if opts.dry_run:
        sys.stdout.write(f"[dry-run] would copy {source} -> {dest}\n")
        return

    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(source, dest)
    sys.stdout.write(f"[OK] installed skill: {name}\n")
