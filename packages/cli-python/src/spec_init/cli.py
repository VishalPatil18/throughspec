"""spec-init entry point. Parses argv, dispatches to a command module."""

from __future__ import annotations

import sys

from . import __version__
from .args import CliOptions, HELP_TEXT, UsageError, parse_args
from .commands.add_skill import run_add_skill
from .commands.customize import run_customize
from .commands.doctor import run_doctor
from .commands.init import run_init
from .commands.upgrade import run_upgrade


def dispatch(opts: CliOptions) -> int:
    """Route a parsed CliOptions to the right runner and return an exit code."""
    if opts.help or opts.command is None:
        sys.stdout.write(HELP_TEXT)
        return 2 if opts.command is None and not opts.help else 0
    if opts.version:
        sys.stdout.write(f"spec-init {__version__}\n")
        return 0
    if opts.command == "init":
        run_init(opts)
        return 0
    if opts.command == "customize":
        run_customize(opts)
        return 0
    if opts.command == "add-skill":
        run_add_skill(opts)
        return 0
    if opts.command == "upgrade":
        report = run_upgrade(opts)
        return 1 if report.conflicted else 0
    if opts.command == "doctor":
        report = run_doctor()
        return 0 if report.ok else 1
    return 2


def main(argv: list[str] | None = None) -> int:
    """Bin entry. Catches UsageError, returns exit code."""
    argv = list(sys.argv[1:] if argv is None else argv)
    try:
        opts = parse_args(argv)
        return dispatch(opts)
    except UsageError as e:
        sys.stderr.write(f"spec-init: {e}\n")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
