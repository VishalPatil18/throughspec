"""Argv parsing for spec-init. Mirrors packages/cli-node/src/args.ts."""

from __future__ import annotations

import argparse
from dataclasses import dataclass, field
from typing import Literal

Persona = Literal["vibe", "student", "engineer", "team"]
Integration = Literal[
    "graphify",
    "obsidian",
    "caveman",
    "agentmemory",
    "openwiki",
    "ponytail",
    "opencodereview",
]
Command = Literal["init", "reinit", "customize", "add-skill", "upgrade", "doctor"]

PERSONAS: tuple[Persona, ...] = ("vibe", "student", "engineer", "team")
INTEGRATIONS: tuple[Integration, ...] = (
    "graphify",
    "obsidian",
    "caveman",
    "agentmemory",
    "openwiki",
    "ponytail",
    "opencodereview",
)
COMMANDS: tuple[Command, ...] = (
    "init",
    "reinit",
    "customize",
    "add-skill",
    "upgrade",
    "doctor",
)


class UsageError(Exception):
    """Raised for user-facing usage errors."""


@dataclass(frozen=True)
class CliOptions:
    """Parsed argv shape, mirroring the Node CLI's CliOptions."""

    command: Command | None = None
    positional: tuple[str, ...] = ()
    persona: Persona | None = None
    integrations: tuple[Integration, ...] = ()
    add_integration: Integration | None = None
    remove_integration: Integration | None = None
    force: bool = False
    dry_run: bool = False
    no_install: bool = False
    help: bool = False
    version: bool = False


HELP_TEXT = """spec-init - scaffold a Throughspec project

USAGE
  spec-init <command> [flags]

COMMANDS
  init <name>         Scaffold a new project into <name>/
  reinit [dir]        Adopt Throughspec in an existing project (in place; keeps your files)
  customize           Toggle integrations or swap the persona for an existing project
  add-skill <name>    Copy a skill from the payload's skills/ catalog into the project
  upgrade             Merge a newer template payload into an existing project (three-way)
  doctor              Verify a scaffolded project's shape

FLAGS
  --persona <name>              vibe | student | engineer | team
  --integrations <a,b>          comma-separated integration names (see README for the full list)
  --add <name>                  used with customize
  --remove <name>               used with customize
  --force                       overwrite existing files during init
  --dry-run                     print the plan; write nothing
  --no-install                  skip auto-installing selected integrations
  -h, --help                    show this text
  -v, --version                 print CLI version and exit

EXAMPLES
  spec-init init my-project --persona student
  spec-init init my-project --persona engineer --integrations graphify,obsidian
  spec-init init my-project --integrations caveman
  spec-init reinit --persona engineer
  spec-init customize --add obsidian
  spec-init upgrade
  spec-init doctor
"""


def _parse_integration_list(value: str, flag: str) -> tuple[Integration, ...]:
    """Split a CSV integration list and validate each entry."""
    parts = [p.strip() for p in value.split(",") if p.strip()]
    for p in parts:
        if p not in INTEGRATIONS:
            raise UsageError(
                f"{flag}: unknown integration '{p}' (valid: {', '.join(INTEGRATIONS)})"
            )
    return tuple(parts)  # type: ignore[return-value]


def parse_args(argv: list[str]) -> CliOptions:
    """Parse an argv slice into a typed CliOptions. Raises UsageError on invalid input."""
    # Split off flags/command manually so we can accept --help / --version without a command.
    if not argv:
        return CliOptions()

    # Handle top-level short-circuits first.
    if argv[0] in ("--help", "-h"):
        return CliOptions(help=True)
    if argv[0] in ("--version", "-v"):
        return CliOptions(version=True)

    first = argv[0]
    if first in COMMANDS:
        command_token = first
        rest = argv[1:]
    elif first.startswith("-"):
        raise UsageError(
            f"unknown command: {first} (try one of: {', '.join(COMMANDS)})"
        )
    else:
        # Implied init: `spec-init my-project` == `spec-init init my-project`.
        command_token = "init"
        rest = argv

    parser = argparse.ArgumentParser(prog=f"spec-init {command_token}", add_help=False)
    parser.add_argument("--persona", choices=list(PERSONAS))
    parser.add_argument("--integrations")
    parser.add_argument("--add", choices=list(INTEGRATIONS))
    parser.add_argument("--remove", choices=list(INTEGRATIONS))
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true", dest="dry_run")
    parser.add_argument("--no-install", action="store_true", dest="no_install")
    parser.add_argument("--help", "-h", action="store_true", dest="help")
    parser.add_argument("--version", "-v", action="store_true", dest="version")
    parser.add_argument("positional", nargs="*")

    try:
        ns = parser.parse_args(rest)
    except SystemExit as e:  # argparse calls sys.exit on unknown flags
        raise UsageError("invalid flag or missing value") from e

    integrations: tuple[Integration, ...] = ()
    if ns.integrations:
        integrations = _parse_integration_list(ns.integrations, "--integrations")

    return CliOptions(
        command=command_token,  # type: ignore[arg-type]
        positional=tuple(ns.positional),
        persona=ns.persona,
        integrations=integrations,
        add_integration=ns.add,
        remove_integration=ns.remove,
        force=ns.force,
        no_install=ns.no_install,
        dry_run=ns.dry_run,
        help=ns.help,
        version=ns.version,
    )


# Keep field() referenced so ruff does not flag the unused import via SIM/F401.
_UNUSED_FIELD = field
