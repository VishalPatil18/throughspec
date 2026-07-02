"""spec-init customize --add <name> | --remove <name> | --persona <name>."""

from __future__ import annotations

import sys
from pathlib import Path

from ..args import CliOptions, UsageError
from ..persona import strip_personas
from .init import flip_integration


def run_customize(opts: CliOptions) -> None:
    """Toggle an integration or swap the persona. Raises UsageError on invalid state."""
    project_root = Path.cwd()
    claude_md = project_root / "CLAUDE.md"
    if not claude_md.exists():
        raise UsageError(
            "customize must be run inside a scaffolded project (CLAUDE.md not found)"
        )

    actions = sum(
        1
        for a in (opts.add_integration, opts.remove_integration, opts.persona)
        if a
    )
    if actions == 0:
        raise UsageError("customize requires --add, --remove, or --persona")
    if actions > 1:
        raise UsageError("customize accepts one of --add / --remove / --persona per invocation")

    content = claude_md.read_text(encoding="utf-8")

    if opts.add_integration:
        content = flip_integration(content, opts.add_integration, on=True)
    elif opts.remove_integration:
        content = flip_integration(content, opts.remove_integration, on=False)
    elif opts.persona:
        base_claude = project_root / ".spec-init" / "base" / "CLAUDE.md"
        if not base_claude.exists():
            raise UsageError(
                "--persona swap requires the .spec-init/base/ snapshot from init; missing here."
            )
        # Re-strip from the pristine snapshot so persona blocks come back cleanly.
        content = strip_personas(
            base_claude.read_text(encoding="utf-8"), opts.persona
        )

    if opts.dry_run:
        sys.stdout.write("[dry-run] CLAUDE.md would be updated\n")
        return

    claude_md.write_text(content, encoding="utf-8", newline="")
    sys.stdout.write("[OK] CLAUDE.md updated\n")
