"""spec-init init <name> [--persona] [--integrations] [--force] [--dry-run]."""

from __future__ import annotations

import json
import re
import shutil
import sys
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

from ..args import INTEGRATIONS, CliOptions, Integration, Persona, UsageError
from ..checklist import post_init_checklist
from ..integrations import strip_integrations
from ..payload import resolve_payload_dir
from ..persona import strip_personas

# Payload prefix (forward-slash) that holds per-integration file trees.
INTEGRATIONS_PREFIX = "_integrations/"


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

    # Offer the integration picker interactively when init ran on a TTY with no
    # explicit --integrations; otherwise this returns opts.integrations unchanged.
    integrations = prompt_integrations(opts)

    all_files = _walk_payload(payload_dir)
    # Files under _integrations/ are per-integration payloads. They are copied
    # conditionally by _apply_integrations(), never as part of the base tree.
    base_files = [rel for rel in all_files if not rel.startswith(INTEGRATIONS_PREFIX)]

    if opts.dry_run:
        sys.stdout.write(f"[dry-run] would write {len(base_files)} files into {out_dir}\n")
        for rel in base_files:
            sys.stdout.write(f"[dry-run]   {rel}\n")
        for rel in integration_files_for(payload_dir, integrations):
            sys.stdout.write(f"[dry-run]   {rel}\n")
        return InitResult(out_dir=out_dir, files_written=0, dry_run=True)

    out_dir.mkdir(parents=True, exist_ok=True)
    written = 0
    for rel in base_files:
        src = payload_dir / rel
        dest = out_dir / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        content = _maybe_transform(rel, src.read_text(encoding="utf-8"), opts.persona, integrations)
        dest.write_text(content, encoding="utf-8", newline="")
        written += 1
    written += apply_integrations(payload_dir, out_dir, integrations)

    # Snapshot the raw payload (including _integrations/) for future
    # `upgrade` and `customize` re-derives.
    base_dir = out_dir / ".spec-init" / "base"
    shutil.copytree(payload_dir, base_dir, dirs_exist_ok=True)
    meta = out_dir / ".spec-init" / "meta.json"
    meta.write_text(
        json.dumps(
            {"persona": opts.persona, "integrations": list(integrations)},
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
    sys.stdout.write(post_init_checklist(rel_str, opts.persona, integrations))
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
    """Apply persona strip and integration strip to `.md` files; others untouched."""
    if not rel.endswith(".md"):
        return content
    out = content
    if rel == "CLAUDE.md" and persona:
        out = strip_personas(out, persona)
    out = strip_integrations(out, integrations)
    return out


def integration_files_for(
    payload_dir: Path,
    active: tuple[Integration, ...],
) -> list[str]:
    """List destination-relative paths that will be written for `active`."""
    out: list[str] = []
    for name in active:
        root = payload_dir / "_integrations" / name
        if not root.exists():
            continue
        out.extend(_walk_payload(root))
    return sorted(out)


def apply_integrations(
    payload_dir: Path,
    out_dir: Path,
    active: tuple[Integration, ...],
) -> int:
    """Copy every file under _integrations/<name>/ into `out_dir` for active names."""
    count = 0
    for name in active:
        root = payload_dir / "_integrations" / name
        if not root.exists():
            continue
        for rel in _walk_payload(root):
            src = root / rel
            dest = out_dir / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(src.read_bytes())
            count += 1
    return count


def prompt_integrations(
    opts: CliOptions,
    isatty: Callable[[], bool] | None = None,
    ask: Callable[[str], str] | None = None,
) -> tuple[Integration, ...]:
    """Prompt for integrations when init ran interactively with no explicit --integrations.

    Returns opts.integrations unchanged when the prompt is not eligible (dry-run,
    non-TTY such as CI/tests, or integrations already chosen).
    """
    if isatty is None:
        isatty = sys.stdin.isatty
    if ask is None:
        ask = input
    current = opts.integrations
    eligible = not opts.dry_run and len(current) == 0 and isatty()
    if not eligible:
        return current
    choice = (
        ask("Integrations to include?\n  1) all\n  2) let me select\n  3) none\n> ")
        .strip()
        .lower()
    )
    if choice in ("1", "all"):
        return INTEGRATIONS
    if choice in ("2", "let me select", "select"):
        sys.stdout.write(
            "Select integrations (space/comma-separated numbers, Enter to submit):\n"
        )
        for i, name in enumerate(INTEGRATIONS, start=1):
            sys.stdout.write(f"  {i}) {name}\n")
        return _parse_selection(ask("> "))
    return ()  # "3" | "none" | empty | unknown -> none (safe default)


def _parse_selection(line: str) -> tuple[Integration, ...]:
    """Map a '1 3' / '1,3' selection line to chosen integrations, in list order."""
    picked = set()
    for tok in re.split(r"[\s,]+", line.strip()):
        if tok.isdigit() and 1 <= int(tok) <= len(INTEGRATIONS):
            picked.add(int(tok))
    return tuple(name for i, name in enumerate(INTEGRATIONS, start=1) if i in picked)
