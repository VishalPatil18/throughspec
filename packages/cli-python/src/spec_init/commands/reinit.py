"""spec-init reinit [dir]: adopt Throughspec in place, keeping existing files unless --force."""

from __future__ import annotations

import json
import shutil
import sys
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from ..args import CliOptions, UsageError
from ..checklist import post_init_checklist
from ..payload import resolve_payload_dir
from .init import (
    INTEGRATIONS_PREFIX,
    _maybe_transform,
    _walk_payload,
    integration_files_for,
    prompt_integrations,
)

ReinitMode = Literal["keep", "replace"]


@dataclass(frozen=True)
class ReinitResult:
    """Summary of a completed reinit run."""

    directory: Path
    written: int
    kept: int
    dry_run: bool


def run_reinit(opts: CliOptions) -> ReinitResult:
    """Adopt Throughspec into an existing project in place. Raises UsageError."""
    dir_arg = opts.positional[0] if opts.positional else "."
    directory = (Path.cwd() / dir_arg).resolve()
    payload_dir = resolve_payload_dir()

    if (directory / ".spec-init" / "base").exists():
        raise UsageError(
            "this project already has a .spec-init/base snapshot - it looks "
            "Throughspec-managed.\n"
            "       Run `spec-init upgrade` to merge a newer template, or "
            "`spec-init customize` to change options."
        )

    integrations = prompt_integrations(opts)

    base_files = [
        rel for rel in _walk_payload(payload_dir) if not rel.startswith(INTEGRATIONS_PREFIX)
    ]
    integration_rel = integration_files_for(payload_dir, integrations)
    existing = {
        rel for rel in (*base_files, *integration_rel) if (directory / rel).exists()
    }
    mode = resolve_reinit_mode(opts, len(existing))

    if opts.dry_run:
        _print_plan(directory, base_files, integration_rel, existing, mode)
        return ReinitResult(directory=directory, written=0, kept=0, dry_run=True)

    written = 0
    kept = 0

    for rel in base_files:
        dest = directory / rel
        if rel in existing and mode == "keep":
            kept += 1
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        content = _maybe_transform(
            rel, (payload_dir / rel).read_text(encoding="utf-8"), opts.persona, integrations
        )
        dest.write_text(content, encoding="utf-8", newline="")
        written += 1

    # Integration payload files are copied raw, honoring the same keep/replace policy.
    for name in integrations:
        root = payload_dir / "_integrations" / name
        if not root.exists():
            continue
        for rel in _walk_payload(root):
            dest = directory / rel
            if rel in existing and mode == "keep":
                kept += 1
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes((root / rel).read_bytes())
            written += 1

    base_dir = directory / ".spec-init" / "base"
    shutil.copytree(payload_dir, base_dir, dirs_exist_ok=True)
    (directory / ".spec-init" / "meta.json").write_text(
        json.dumps({"persona": opts.persona, "integrations": list(integrations)}, indent=2)
        + "\n",
        encoding="utf-8",
    )

    try:
        rel_dir = str(directory.relative_to(Path.cwd())) or "."
    except ValueError:
        rel_dir = str(directory)
    sys.stdout.write(f"\nAdopted Throughspec in {rel_dir}: {written} written, {kept} kept.\n")
    sys.stdout.write(post_init_checklist(rel_dir, opts.persona, integrations, "Initialized"))
    return ReinitResult(directory=directory, written=written, kept=kept, dry_run=False)


def resolve_reinit_mode(
    opts: CliOptions,
    existing_count: int,
    isatty: Callable[[], bool] | None = None,
    ask: Callable[[str], str] | None = None,
) -> ReinitMode:
    """Decide keep vs replace for existing spec files. Default is the safe `keep`."""
    if isatty is None:
        isatty = sys.stdin.isatty
    if ask is None:
        ask = input
    if opts.force:
        return "replace"
    if existing_count == 0:
        return "replace"  # nothing to keep; write every missing file
    if opts.dry_run or not isatty():
        return "keep"  # safe non-interactive default
    answer = ask(
        f"Found {existing_count} existing spec file(s). Keep them, or replace "
        "with fresh templates? [keep/replace] "
    ).strip().lower()
    return "replace" if answer in ("replace", "r") else "keep"


def _print_plan(
    directory: Path,
    base_files: list[str],
    integration_rel: list[str],
    existing: set[str],
    mode: ReinitMode,
) -> None:
    """Print the dry-run plan: which files would be written vs kept."""
    all_files = [*base_files, *integration_rel]
    will_keep = [rel for rel in all_files if rel in existing] if mode == "keep" else []
    keep_set = set(will_keep)
    will_write = [rel for rel in all_files if rel not in keep_set]
    try:
        rel_dir = str(directory.relative_to(Path.cwd())) or "."
    except ValueError:
        rel_dir = str(directory)
    sys.stdout.write(
        f"[dry-run] reinit {rel_dir} (mode: {mode}): "
        f"{len(will_write)} would be written, {len(will_keep)} kept\n"
    )
    for rel in will_write:
        sys.stdout.write(f"[dry-run]   write  {rel}\n")
    for rel in will_keep:
        sys.stdout.write(f"[dry-run]   keep   {rel}\n")
