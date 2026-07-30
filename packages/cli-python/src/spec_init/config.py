"""Read/write the CLI-managed persona + integrations in spec.config.js.

spec.config.js is the project's ground-truth config. The CLI only touches the
two fields inside the `spec-init:managed` markers and reads them by regex (the
file is JS, so this must not execute it - mirrors packages/cli-node/src/config.ts).
"""

from __future__ import annotations

import json
import re
import shutil
from dataclasses import dataclass, field
from pathlib import Path

from .args import INTEGRATIONS, PERSONAS, Integration, Persona

DEFAULT_PERSONA: Persona = "engineer"

_PERSONA_RE = re.compile(r"persona:\s*['\"]([^'\"]*)['\"]")
_INTEGRATIONS_RE = re.compile(r"integrations:\s*\[(.*?)\]", re.DOTALL)
_NAME_RE = re.compile(r"['\"]([a-z-]+)['\"]")


@dataclass(frozen=True)
class ProjectConfig:
    """Parsed persona + integrations from spec.config.js."""

    persona: Persona | None = None
    integrations: tuple[Integration, ...] = field(default_factory=tuple)


def config_path(project_root: Path) -> Path:
    """Absolute path to a project's spec.config.js."""
    return project_root / "spec.config.js"


def is_managed(project_root: Path) -> bool:
    """True when a directory looks Throughspec-managed (has spec.config.js)."""
    return config_path(project_root).exists()


def parse_config(src: str) -> ProjectConfig:
    """Parse persona + integrations out of a spec.config.js source string."""
    persona: Persona | None = None
    pm = _PERSONA_RE.search(src)
    if pm and pm.group(1) in PERSONAS:
        persona = pm.group(1)  # type: ignore[assignment]
    integrations: list[Integration] = []
    im = _INTEGRATIONS_RE.search(src)
    if im:
        for name in _NAME_RE.findall(im.group(1)):
            if name in INTEGRATIONS:
                integrations.append(name)  # type: ignore[arg-type]
    return ProjectConfig(persona=persona, integrations=tuple(integrations))


def read_config(project_root: Path) -> ProjectConfig:
    """Read persona + integrations from a project's spec.config.js."""
    p = config_path(project_root)
    if not p.exists():
        return ProjectConfig()
    return parse_config(p.read_text(encoding="utf-8"))


def apply_config(src: str, cfg: ProjectConfig) -> str:
    """Return `src` with the managed persona + integrations fields set to `cfg`."""
    listed = ", ".join(f"'{i}'" for i in cfg.integrations)
    out = _PERSONA_RE.sub(f"persona: '{cfg.persona or DEFAULT_PERSONA}'", src, count=1)
    out = _INTEGRATIONS_RE.sub(f"integrations: [{listed}]", out, count=1)
    return out


def write_config(project_root: Path, cfg: ProjectConfig) -> None:
    """Write persona + integrations into a project's spec.config.js in place."""
    p = config_path(project_root)
    p.write_text(apply_config(p.read_text(encoding="utf-8"), cfg), encoding="utf-8", newline="")


_MANAGED_BLOCK = (
    "  // <spec-init:managed>\n"
    "  persona: 'engineer',\n"
    "  integrations: [],\n"
    "  // </spec-init:managed>\n\n"
)


def migrate_legacy(project_root: Path) -> bool:
    """Migrate a pre-1.2 project (.spec-init/meta.json + base snapshot) to the
    spec.config.js-as-ground-truth model, then delete .spec-init/. Returns True
    when a migration happened. Safe to call on already-migrated projects."""
    spec_dir = project_root / ".spec-init"
    if not spec_dir.exists():
        return False

    persona: Persona | None = None
    integrations: list[Integration] = []
    meta = spec_dir / "meta.json"
    if meta.exists():
        try:
            raw = json.loads(meta.read_text(encoding="utf-8"))
            if raw.get("persona") in PERSONAS:
                persona = raw["persona"]
            if isinstance(raw.get("integrations"), list):
                integrations = [n for n in raw["integrations"] if n in INTEGRATIONS]
        except (json.JSONDecodeError, OSError):
            pass

    cfg_path = config_path(project_root)
    if cfg_path.exists():
        src = cfg_path.read_text(encoding="utf-8")
        if not re.search(r"persona:\s*['\"]", src):
            # Old-format spec.config.js: drop the legacy comment, inject the block.
            src = re.sub(r"// active-persona:.*\n\n?", "", src, count=1)
            src = src.replace("module.exports = {\n", "module.exports = {\n" + _MANAGED_BLOCK, 1)
        cfg_path.write_text(
            apply_config(src, ProjectConfig(persona=persona, integrations=tuple(integrations))),
            encoding="utf-8",
            newline="",
        )

    shutil.rmtree(spec_dir)
    return True
