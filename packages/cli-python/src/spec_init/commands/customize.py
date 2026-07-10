"""spec-init customize --add <name> | --remove <name> | --persona <name>.

Non-destructive by default: only replays template-managed files that host
persona or integration markers. Everything else (memory files without
integration markers, user source code, .git, .spec-init) is left alone.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from ..args import CliOptions, Integration, Persona, UsageError
from ..integrations import strip_integrations
from ..persona import strip_personas
from .init import INTEGRATIONS_PREFIX, apply_integrations


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

    snapshot_dir = project_root / ".spec-init" / "base"
    if not snapshot_dir.exists():
        raise UsageError(
            "customize requires the .spec-init/base/ snapshot from init; missing here."
        )

    meta = _read_meta(project_root)
    next_persona: Persona | None = meta["persona"]
    next_integrations: list[Integration] = list(meta["integrations"])
    target: Integration | None = None
    mode: str = "persona"

    if opts.add_integration:
        mode = "add"
        target = opts.add_integration
        if target not in next_integrations:
            next_integrations.append(target)
    elif opts.remove_integration:
        mode = "remove"
        target = opts.remove_integration
        next_integrations = [n for n in next_integrations if n != target]
    elif opts.persona:
        next_persona = opts.persona

    rederived = _rederive(
        snapshot_dir,
        project_root,
        mode,
        target,
        next_persona,
        tuple(next_integrations),
        opts.dry_run,
    )
    integration_touched = _apply_integration_files(
        snapshot_dir,
        project_root,
        mode,
        target,
        opts.dry_run,
    )

    if opts.dry_run:
        sys.stdout.write(
            f"[dry-run] would re-derive {rederived} file(s) and touch "
            f"{integration_touched} integration file(s)\n"
        )
        return

    meta_path = project_root / ".spec-init" / "meta.json"
    meta_path.write_text(
        json.dumps(
            {"persona": next_persona, "integrations": next_integrations},
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    sys.stdout.write(
        f"[OK] customize: {rederived} file(s) re-derived, "
        f"{integration_touched} integration file(s) updated\n"
    )


def _read_meta(project_root: Path) -> dict[str, object]:
    meta_path = project_root / ".spec-init" / "meta.json"
    if not meta_path.exists():
        return {"persona": None, "integrations": []}
    raw = json.loads(meta_path.read_text(encoding="utf-8"))
    return {
        "persona": raw.get("persona"),
        "integrations": list(raw.get("integrations") or []),
    }


def _rederive(
    snapshot_dir: Path,
    out_dir: Path,
    mode: str,
    target: Integration | None,
    persona: Persona | None,
    integrations: tuple[Integration, ...],
    dry_run: bool,
) -> int:
    """Re-derive files from the snapshot that carry markers for the current action."""
    marker = "<!-- persona:" if mode == "persona" else f"<!-- integration:{target} -->"
    count = 0
    for path in sorted(snapshot_dir.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(snapshot_dir).as_posix()
        if rel.startswith(INTEGRATIONS_PREFIX) or not rel.endswith(".md"):
            continue
        snap_content = path.read_text(encoding="utf-8")
        if marker not in snap_content:
            continue
        out = snap_content
        if rel == "CLAUDE.md" and persona:
            out = strip_personas(out, persona)
        out = strip_integrations(out, integrations)
        if not dry_run:
            dest = out_dir / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(out, encoding="utf-8", newline="")
        count += 1
    return count


def _apply_integration_files(
    snapshot_dir: Path,
    out_dir: Path,
    mode: str,
    target: Integration | None,
    dry_run: bool,
) -> int:
    """Copy (--add) or delete (--remove) files under _integrations/<target>/."""
    if mode == "persona" or target is None:
        return 0
    integration_root = snapshot_dir / "_integrations" / target
    if not integration_root.exists():
        return 0
    files = [
        p.relative_to(integration_root).as_posix()
        for p in sorted(integration_root.rglob("*"))
        if p.is_file()
    ]
    if mode == "add":
        if dry_run:
            return len(files)
        return apply_integrations(snapshot_dir, out_dir, (target,))

    count = 0
    dirs_to_prune: set[str] = set()
    for rel in files:
        dest = out_dir / rel
        if dest.exists():
            if not dry_run:
                dest.unlink()
            count += 1
        parent_rel = str(Path(rel).parent).replace("\\", "/")
        if parent_rel and parent_rel != ".":
            dirs_to_prune.add(parent_rel)
    if not dry_run:
        _prune_empty(out_dir, dirs_to_prune)
    return count


def _prune_empty(out_dir: Path, dirs: set[str]) -> None:
    """Delete now-empty directories that hosted an integration's files."""
    ordered = sorted(dirs, key=len, reverse=True)
    for rel in ordered:
        cur = rel
        while cur and cur != ".":
            abs_path = out_dir / cur
            if not abs_path.exists():
                break
            if any(abs_path.iterdir()):
                break
            abs_path.rmdir()
            cur = str(Path(cur).parent).replace("\\", "/")
