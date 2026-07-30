"""spec-init upgrade: pull a newer template into the project without losing data.

CLI-owned files are replaced, user data is preserved, and mixed files (CLAUDE.md)
have only their managed regions swapped. No snapshot needed - the shipped payload
is the new template; spec.config.js is the ground-truth config.
"""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from pathlib import Path

from ..args import CliOptions, UsageError
from ..config import is_managed, migrate_legacy, read_config
from ..managed_region import classify, swap_managed_regions
from ..payload import resolve_payload_dir
from .init import INTEGRATIONS_PREFIX, _maybe_transform, _walk_payload, apply_integrations


@dataclass
class UpgradeReport:
    """Aggregate outcome of an upgrade run."""

    replaced: list[str] = field(default_factory=list)
    preserved: list[str] = field(default_factory=list)
    managed: list[str] = field(default_factory=list)
    added: list[str] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)


def run_upgrade(opts: CliOptions) -> UpgradeReport:
    """Never overwrites user data; managed regions are swapped in place."""
    project_root = Path.cwd()
    if not is_managed(project_root):
        raise UsageError(
            "not a Throughspec project (spec.config.js not found). Run `spec-init reinit` first."
        )
    migrated = migrate_legacy(project_root)
    cfg = read_config(project_root)
    theirs_dir = resolve_payload_dir()
    dry = opts.dry_run

    report = UpgradeReport()
    for rel in _walk_payload(theirs_dir):
        if rel.startswith(INTEGRATIONS_PREFIX):
            continue
        ours_path = project_root / rel
        theirs_path = theirs_dir / rel
        cls = classify(rel)
        theirs = _maybe_transform(
            rel, theirs_path.read_text(encoding="utf-8"), cfg.persona, cfg.integrations
        )

        if cls == "preserve":
            if ours_path.exists():
                report.preserved.append(rel)
            else:
                if not dry:
                    _write(ours_path, theirs)
                report.added.append(rel)
            continue

        if cls == "managed":
            if not ours_path.exists():
                if not dry:
                    _write(ours_path, theirs)
                report.added.append(rel)
                continue
            ours = ours_path.read_text(encoding="utf-8")
            swapped = swap_managed_regions(ours, theirs)
            if swapped is None:
                report.skipped.append(rel)
            elif swapped != ours:
                if not dry:
                    ours_path.write_text(swapped, encoding="utf-8", newline="")
                report.managed.append(rel)
            else:
                report.preserved.append(rel)
            continue

        # replace (CLI-owned)
        ours_text = ours_path.read_text(encoding="utf-8") if ours_path.exists() else None
        if ours_text == theirs:
            continue
        if not dry:
            _write(ours_path, theirs)
        report.replaced.append(rel)

    if not dry:
        apply_integrations(theirs_dir, project_root, cfg.integrations)

    _print_report(report, dry, migrated)
    return report


def _write(dest: Path, content: str) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(content, encoding="utf-8", newline="")


def _print_report(r: UpgradeReport, dry: bool, migrated: bool) -> None:
    p = "[dry-run] " if dry else ""
    if migrated:
        sys.stdout.write(f"{p}migrated legacy .spec-init/ into spec.config.js\n")
    sys.stdout.write(f"{p}upgrade summary:\n")
    sys.stdout.write(f"{p}  {len(r.replaced)} replaced (CLI-owned)\n")
    sys.stdout.write(f"{p}  {len(r.managed)} instructions refreshed (managed regions)\n")
    sys.stdout.write(f"{p}  {len(r.added)} new files added\n")
    sys.stdout.write(f"{p}  {len(r.preserved)} preserved (your data, untouched)\n")
    if r.skipped:
        sys.stdout.write(f"{p}  {len(r.skipped)} skipped (no managed markers - left as-is):\n")
        for rel in r.skipped:
            sys.stdout.write(f"{p}    ~ {rel}\n")
