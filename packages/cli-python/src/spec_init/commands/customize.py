"""spec-init customize --add/--remove/--persona: update spec.config.js (ground
truth), re-derive CLAUDE.md's managed region, and add/remove integration files.
"""

from __future__ import annotations

import sys
from pathlib import Path

from ..args import CliOptions, Integration, UsageError
from ..config import ProjectConfig, is_managed, read_config, write_config
from ..integrations import install_integrations
from ..managed_region import swap_managed_regions
from ..payload import resolve_payload_dir
from .init import _maybe_transform, _walk_payload, apply_integrations


def run_customize(opts: CliOptions) -> None:
    """Update config, re-derive CLAUDE.md's managed region, add/remove integration files."""
    project_root = Path.cwd()
    if not is_managed(project_root):
        raise UsageError(
            "customize must be run inside a scaffolded project (spec.config.js not found)"
        )

    actions = sum(1 for a in (opts.add_integration, opts.remove_integration, opts.persona) if a)
    if actions == 0:
        raise UsageError("customize requires --add, --remove, or --persona")
    if actions > 1:
        raise UsageError("customize accepts one of --add / --remove / --persona per invocation")

    cfg = read_config(project_root)
    next_persona = cfg.persona
    next_integrations = list(cfg.integrations)
    target: Integration | None = None
    mode = "persona"

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

    payload_dir = resolve_payload_dir()

    if opts.dry_run:
        sys.stdout.write(
            f"[dry-run] would set persona={next_persona or 'engineer'}, "
            f"integrations=[{', '.join(next_integrations)}]\n"
        )
        return

    # 1. Persist config (ground truth).
    write_config(
        project_root, ProjectConfig(persona=next_persona, integrations=tuple(next_integrations))
    )

    # 2. Re-derive CLAUDE.md's managed region for the new persona/integrations.
    claude = project_root / "CLAUDE.md"
    if claude.exists():
        theirs = _maybe_transform(
            "CLAUDE.md",
            (payload_dir / "CLAUDE.md").read_text(encoding="utf-8"),
            next_persona,
            tuple(next_integrations),
        )
        swapped = swap_managed_regions(claude.read_text(encoding="utf-8"), theirs)
        if swapped:
            claude.write_text(swapped, encoding="utf-8", newline="")

    # 3. Integration files: add copies them in, remove deletes them.
    touched = 0
    if mode == "add" and target:
        touched = apply_integrations(payload_dir, project_root, (target,))
    elif mode == "remove" and target:
        touched = _remove_integration_files(payload_dir, project_root, target)

    # 4. Auto-install a newly added integration (respects --no-install / non-TTY).
    if mode == "add" and target:
        install_integrations((target,), is_tty=sys.stdin.isatty(), no_install=opts.no_install)

    sys.stdout.write(
        f"[OK] customize: persona={next_persona or 'engineer'}, "
        f"integrations=[{', '.join(next_integrations)}] ({touched} integration file(s) changed)\n"
    )


def _remove_integration_files(payload_dir: Path, project_root: Path, target: Integration) -> int:
    """Delete an integration's files from the project and prune emptied dirs."""
    root = payload_dir / "_integrations" / target
    if not root.exists():
        return 0
    count = 0
    dirs: set[str] = set()
    for rel in _walk_payload(root):
        dest = project_root / rel
        if dest.exists():
            dest.unlink()
            count += 1
            dirs.add(str(Path(rel).parent).replace("\\", "/"))
    _prune_empty(project_root, dirs)
    return count


def _prune_empty(out_dir: Path, dirs: set[str]) -> None:
    """Remove now-empty directories that hosted an integration's files."""
    for rel in sorted(dirs, key=len, reverse=True):
        cur = rel
        while cur and cur != ".":
            abs_path = out_dir / cur
            if not abs_path.exists():
                break
            if any(abs_path.iterdir()):
                break
            abs_path.rmdir()
            cur = str(Path(cur).parent).replace("\\", "/")
