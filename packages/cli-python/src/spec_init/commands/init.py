"""spec-init init <name> [--persona] [--integrations] [--force] [--dry-run]."""

from __future__ import annotations

import json
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

from ..args import CliOptions, Integration, Persona, UsageError
from ..checklist import post_init_checklist
from ..payload import resolve_payload_dir
from ..persona import strip_personas


@dataclass(frozen=True)
class InitResult:
    """Summary of a completed init run."""

    out_dir: Path
    files_written: int
    dry_run: bool


def run_init(opts: CliOptions) -> InitResult:
    """Scaffold a new project. Raises UsageError on user-facing errors."""
    if not opts.positional:
        raise UsageError("init requires a project name: spec-init init <name>")
    name = opts.positional[0]
    out_dir = Path.cwd() / name
    payload_dir = resolve_payload_dir()

    if out_dir.exists() and not opts.force:
        existing = [p for p in out_dir.iterdir() if not p.name.startswith(".")]
        if existing:
            raise UsageError(
                f"refusing to overwrite non-empty directory: {out_dir}\n"
                "       Pass --force to proceed, or choose a different name."
            )

    files = _walk_payload(payload_dir)

    if opts.dry_run:
        sys.stdout.write(f"[dry-run] would write {len(files)} files into {out_dir}\n")
        for rel in files:
            sys.stdout.write(f"[dry-run]   {rel}\n")
        return InitResult(out_dir=out_dir, files_written=0, dry_run=True)

    out_dir.mkdir(parents=True, exist_ok=True)
    written = 0
    for rel in files:
        src = payload_dir / rel
        dest = out_dir / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        content = _maybe_transform(rel, src.read_text(encoding="utf-8"), opts.persona, opts.integrations)
        dest.write_text(content, encoding="utf-8", newline="")
        written += 1

    # Snapshot the raw payload for future three-way upgrades. dirs_exist_ok
    # lets --force re-init overwrite an existing snapshot.
    base_dir = out_dir / ".spec-init" / "base"
    shutil.copytree(payload_dir, base_dir, dirs_exist_ok=True)
    meta = out_dir / ".spec-init" / "meta.json"
    meta.write_text(
        json.dumps(
            {"persona": opts.persona, "integrations": list(opts.integrations)},
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    try:
        rel_out = out_dir.relative_to(Path.cwd())
        rel_str = str(rel_out) or "."
    except ValueError:
        rel_str = str(out_dir)
    sys.stdout.write(post_init_checklist(rel_str, opts.persona))
    return InitResult(out_dir=out_dir, files_written=written, dry_run=False)


def _walk_payload(root: Path) -> list[str]:
    """List every file under `root` as sorted forward-slash relative paths."""
    out: list[str] = []
    for path in root.rglob("*"):
        if path.is_file():
            out.append(path.relative_to(root).as_posix())
    return sorted(out)


def _maybe_transform(
    rel: str,
    content: str,
    persona: Persona | None,
    integrations: tuple[Integration, ...],
) -> str:
    """Apply persona strip and integration checkbox flip to CLAUDE.md only."""
    if rel != "CLAUDE.md":
        return content
    out = content
    if persona:
        out = strip_personas(out, persona)
    for name in integrations:
        out = flip_integration(out, name, on=True)
    return out


def flip_integration(content: str, name: Integration, *, on: bool) -> str:
    """Flip the `- [ ] <Name>` line in CLAUDE.md section 8 to `- [x]` (or back)."""
    label = "Graphify" if name == "graphify" else "Obsidian"
    from_ = f"- [ ] {label}" if on else f"- [x] {label}"
    to = f"- [x] {label}" if on else f"- [ ] {label}"
    return content.replace(from_, to)
