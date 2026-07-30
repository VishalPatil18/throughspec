"""Strip integration-gated blocks; byte-parity Python port of strip-integrations.mjs."""

from __future__ import annotations

import re
import subprocess
import sys
from collections.abc import Callable
from dataclasses import dataclass
from typing import Iterable

from .args import Integration

INTEGRATION_NAMES: tuple[Integration, ...] = (
    "graphify",
    "obsidian",
    "caveman",
    "agentmemory",
    "openwiki",
    "ponytail",
    "opencodereview",
)
_VALID = frozenset(INTEGRATION_NAMES)
_BLOCK_RE = re.compile(
    r"<!--\s*integration:([a-z]+)\s*-->(.*?)<!--\s*/integration:\1\s*-->\n?",
    re.DOTALL,
)


def strip_integrations(source: str, active: Iterable[Integration]) -> str:
    """Strip integration blocks; keep those whose NAME appears in `active`."""
    active_set = set(active)

    def repl(match: re.Match[str]) -> str:
        name = match.group(1)
        body = match.group(2)
        if name not in _VALID:
            raise ValueError(f"unknown integration in marker: {name}")
        return body if name in active_set else ""

    stripped = _BLOCK_RE.sub(repl, source)
    stripped = re.sub(r"<!--\s*prettier-ignore-(start|end)\s*-->\n?", "", stripped)
    stripped = re.sub(r"\n{3,}", "\n\n", stripped)
    stripped = re.sub(r"^\n+", "", stripped)
    stripped = re.sub(r"\n+$", "\n", stripped)
    return stripped


# --- Registry: docs + optional local installer per integration ------------


@dataclass(frozen=True)
class IntegrationInfo:
    """Friendly name, official docs, and optional local install command."""

    title: str
    docs_url: str
    install: tuple[str, ...] | None


INTEGRATION_REGISTRY: dict[Integration, IntegrationInfo] = {
    "graphify": IntegrationInfo("Graphify", "https://graphify.net/", None),
    "obsidian": IntegrationInfo("Obsidian", "https://obsidian.md/", None),
    "caveman": IntegrationInfo(
        "Caveman",
        "https://github.com/JuliusBrussee/caveman",
        ("npx", "--yes", "skills", "add", "JuliusBrussee/caveman"),
    ),
    "agentmemory": IntegrationInfo("agentmemory", "https://github.com/rohitg00/agentmemory", None),
    "openwiki": IntegrationInfo("openwiki", "https://github.com/langchain-ai/openwiki", None),
    "ponytail": IntegrationInfo("ponytail", "https://github.com/DietrichGebert/ponytail", None),
    "opencodereview": IntegrationInfo(
        "Open Code Review", "https://github.com/alibaba/open-code-review", None
    ),
}


@dataclass(frozen=True)
class InstallResult:
    """Outcome of trying to install one integration."""

    name: Integration
    status: str  # 'installed' | 'failed' | 'manual' | 'skipped'
    command: str = ""


def _default_run(argv: tuple[str, ...]) -> bool:
    return subprocess.run(list(argv), check=False).returncode == 0


def install_integrations(
    active: Iterable[Integration],
    is_tty: bool,
    no_install: bool,
    run: Callable[[tuple[str, ...]], bool] | None = None,
) -> list[InstallResult]:
    """Run the known installer for each active integration that ships one.

    Skips all installs on a non-TTY run or when `no_install` is set (reports the
    command as `manual`). Never raises - a failed install is reported, not fatal.
    """
    runner = run or _default_run
    out: list[InstallResult] = []
    for name in active:
        info = INTEGRATION_REGISTRY[name]
        if info.install is None:
            continue  # link-only integration
        command = " ".join(info.install)
        if no_install or not is_tty:
            out.append(InstallResult(name=name, status="manual", command=command))
            continue
        sys.stdout.write(f"\nInstalling {info.title}: {command}\n")
        ok = runner(info.install)
        out.append(InstallResult(name=name, status="installed" if ok else "failed", command=command))
    return out
