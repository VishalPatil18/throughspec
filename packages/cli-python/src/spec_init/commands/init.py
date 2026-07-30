"""spec-init init <name>: scaffold the payload into <name>/.

spec.config.js is the ground-truth config; there is no .spec-init snapshot.
"""

from __future__ import annotations

import re
import sys
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

from ..args import INTEGRATIONS, PERSONAS, CliOptions, Integration, Persona, UsageError
from ..checklist import post_init_checklist
from ..config import DEFAULT_PERSONA, ProjectConfig, apply_config
from ..integrations import InstallResult, install_integrations, strip_integrations
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


def run_init(opts: CliOptions, quiet: bool = False) -> InitResult:
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

    persona = (opts.persona or DEFAULT_PERSONA) if quiet else prompt_persona(opts)
    integrations = tuple(opts.integrations) if quiet else prompt_integrations(opts)

    all_files = _walk_payload(payload_dir)
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
        content = _maybe_transform(rel, src.read_text(encoding="utf-8"), persona, integrations)
        if rel == "spec.config.js":
            content = apply_config(content, ProjectConfig(persona=persona, integrations=integrations))
        dest.write_text(content, encoding="utf-8", newline="")
        written += 1
    written += apply_integrations(payload_dir, out_dir, integrations)

    install_results: list[InstallResult] = (
        []
        if quiet
        else install_integrations(integrations, is_tty=sys.stdin.isatty(), no_install=opts.no_install)
    )

    if not quiet:
        try:
            rel_str = str(out_dir.relative_to(Path.cwd())) or "."
        except ValueError:
            rel_str = str(out_dir)
        sys.stdout.write(post_init_checklist(rel_str, persona, integrations, install_results))
    return InitResult(out_dir=out_dir, files_written=written, dry_run=False)


def _walk_payload(root: Path) -> list[str]:
    """List every file under `root` as sorted forward-slash relative paths."""
    return sorted(p.relative_to(root).as_posix() for p in root.rglob("*") if p.is_file())


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


def integration_files_for(payload_dir: Path, active: tuple[Integration, ...]) -> list[str]:
    """List destination-relative paths that will be written for `active`."""
    out: list[str] = []
    for name in active:
        root = payload_dir / "_integrations" / name
        if not root.exists():
            continue
        out.extend(_walk_payload(root))
    return sorted(out)


def apply_integrations(payload_dir: Path, out_dir: Path, active: tuple[Integration, ...]) -> int:
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


def prompt_persona(
    opts: CliOptions,
    isatty: Callable[[], bool] | None = None,
    ask: Callable[[str], str] | None = None,
) -> Persona:
    """Prompt for a persona on an eligible interactive run; else --persona or the default."""
    if opts.persona:
        return opts.persona
    if isatty is None:
        isatty = sys.stdin.isatty
    if ask is None:
        ask = input
    if opts.dry_run or not isatty():
        return DEFAULT_PERSONA
    sys.stdout.write("Persona? (tunes CLAUDE.md and guidance)\n")
    for i, p in enumerate(PERSONAS, start=1):
        sys.stdout.write(f"  {i}) {p}\n")
    choice = ask("> ").strip().lower()
    if choice.isdigit() and 1 <= int(choice) <= len(PERSONAS):
        return PERSONAS[int(choice) - 1]
    if choice in PERSONAS:
        return choice  # type: ignore[return-value]
    return DEFAULT_PERSONA


def prompt_integrations(
    opts: CliOptions,
    isatty: Callable[[], bool] | None = None,
    ask: Callable[[str], str] | None = None,
) -> tuple[Integration, ...]:
    """Prompt for integrations on an eligible interactive run; else return opts.integrations."""
    if isatty is None:
        isatty = sys.stdin.isatty
    if ask is None:
        ask = input
    current = opts.integrations
    eligible = not opts.dry_run and len(current) == 0 and isatty()
    if not eligible:
        return current
    choice = (
        ask("Integrations to include?\n  1) all\n  2) let me select\n  3) none\n> ").strip().lower()
    )
    if choice in ("1", "all"):
        return INTEGRATIONS
    if choice in ("2", "let me select", "select"):
        sys.stdout.write("Select integrations (space/comma-separated numbers, Enter to submit):\n")
        for i, name in enumerate(INTEGRATIONS, start=1):
            sys.stdout.write(f"  {i}) {name}\n")
        return _parse_selection(ask("> "))
    return ()


def _parse_selection(line: str) -> tuple[Integration, ...]:
    """Map a '1 3' / '1,3' selection line to chosen integrations, in list order."""
    picked = set()
    for tok in re.split(r"[\s,]+", line.strip()):
        if tok.isdigit() and 1 <= int(tok) <= len(INTEGRATIONS):
            picked.add(int(tok))
    return tuple(name for i, name in enumerate(INTEGRATIONS, start=1) if i in picked)
