"""spec-init upgrade - three-way merge the shipped payload into the project."""

from __future__ import annotations

import shutil
import sys
from dataclasses import dataclass, field
from pathlib import Path

from ..args import CliOptions, UsageError
from ..payload import resolve_payload_dir
from ..three_way_merge import three_way_merge


@dataclass
class UpgradeReport:
    """Aggregate outcome of an upgrade run."""

    updated: list[str] = field(default_factory=list)
    merged: list[str] = field(default_factory=list)
    conflicted: list[str] = field(default_factory=list)


def run_upgrade(opts: CliOptions) -> UpgradeReport:
    """Merge the shipped payload into the project. Caller decides exit code."""
    project_root = Path.cwd()
    base_dir = project_root / ".spec-init" / "base"
    if not base_dir.exists():
        raise UsageError(
            "upgrade requires the .spec-init/base/ snapshot. "
            "Was this project scaffolded with spec-init?"
        )
    theirs_dir = resolve_payload_dir()

    report = UpgradeReport()
    for rel in _walk(theirs_dir):
        base_path = base_dir / rel
        ours_path = project_root / rel
        theirs_path = theirs_dir / rel

        theirs = theirs_path.read_text(encoding="utf-8")
        base = base_path.read_text(encoding="utf-8") if base_path.exists() else ""
        ours = ours_path.read_text(encoding="utf-8") if ours_path.exists() else base

        if base == theirs:
            continue  # template unchanged in this release
        if base == ours:
            if opts.dry_run:
                report.updated.append(rel)
                continue
            ours_path.parent.mkdir(parents=True, exist_ok=True)
            ours_path.write_text(theirs, encoding="utf-8", newline="")
            report.updated.append(rel)
            continue

        result = three_way_merge(base, ours, theirs)
        if opts.dry_run:
            (report.conflicted if result.has_conflict else report.merged).append(rel)
            continue
        ours_path.parent.mkdir(parents=True, exist_ok=True)
        ours_path.write_text(result.merged, encoding="utf-8", newline="")
        (report.conflicted if result.has_conflict else report.merged).append(rel)

    if not opts.dry_run:
        # Refresh the snapshot so the next upgrade uses the new baseline.
        shutil.rmtree(base_dir)
        shutil.copytree(theirs_dir, base_dir)

    _print_report(report, opts.dry_run)
    return report


def _print_report(r: UpgradeReport, dry_run: bool) -> None:
    """Emit the upgrade summary to stdout."""
    prefix = "[dry-run] " if dry_run else ""
    sys.stdout.write(f"{prefix}upgrade summary:\n")
    sys.stdout.write(f"{prefix}  {len(r.updated)} taken from new template\n")
    sys.stdout.write(f"{prefix}  {len(r.merged)} merged cleanly\n")
    sys.stdout.write(
        f"{prefix}  {len(r.conflicted)} conflicts requiring manual resolution\n"
    )
    for rel in r.conflicted:
        sys.stdout.write(f"{prefix}    ! {rel}\n")


def _walk(root: Path) -> list[str]:
    """Return every file under `root` as sorted forward-slash relative paths."""
    return sorted(p.relative_to(root).as_posix() for p in root.rglob("*") if p.is_file())
