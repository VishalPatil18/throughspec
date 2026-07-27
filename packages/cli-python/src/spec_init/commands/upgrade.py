"""spec-init upgrade - three-way merge the shipped payload into the project."""

from __future__ import annotations

import json
import shutil
import sys
from dataclasses import dataclass, field
from pathlib import Path

from ..args import CliOptions, UsageError
from ..payload import resolve_payload_dir
from ..three_way_merge import three_way_merge
from .init import INTEGRATIONS_PREFIX, _maybe_transform
from ..persona import stamp_persona


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

    meta = _read_meta(project_root)
    persona = meta["persona"]
    integrations = tuple(meta["integrations"])

    report = UpgradeReport()
    for rel in _walk(theirs_dir):
        if rel.startswith(INTEGRATIONS_PREFIX):
            continue  # integration trees are not project-root files

        base_path = base_dir / rel
        ours_path = project_root / rel
        theirs_path = theirs_dir / rel

        theirs = _maybe_transform(rel, theirs_path.read_text(encoding="utf-8"), persona, integrations)
        base = (
            _maybe_transform(rel, base_path.read_text(encoding="utf-8"), persona, integrations)
            if base_path.exists()
            else ""
        )
        ours = ours_path.read_text(encoding="utf-8") if ours_path.exists() else base

        if rel == "spec.config.js":
            base = stamp_persona(base, None)
            theirs = stamp_persona(theirs, None)
            ours = stamp_persona(ours, None)

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

    if not opts.dry_run and persona:
        cfg = project_root / "spec.config.js"
        if cfg.exists():
            cfg.write_text(
                stamp_persona(cfg.read_text(encoding="utf-8"), persona),
                encoding="utf-8",
                newline="",
            )

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


def _read_meta(project_root: Path) -> dict:
    """Read persona + integrations recorded at init; defaults for older/absent snapshots."""
    p = project_root / ".spec-init" / "meta.json"
    if not p.exists():
        return {"persona": None, "integrations": []}
    try:
        raw = json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"persona": None, "integrations": []}
    return {"persona": raw.get("persona"), "integrations": list(raw.get("integrations") or [])}
