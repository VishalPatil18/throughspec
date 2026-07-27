"""Argv parsing tests."""

from __future__ import annotations

import pytest

from spec_init.args import UsageError, parse_args


def test_bare_returns_no_command() -> None:
    """No args → empty CliOptions with no command."""
    opts = parse_args([])
    assert opts.command is None
    assert opts.help is False


def test_help_short_circuit() -> None:
    """--help before a command → help=True, no command validation."""
    opts = parse_args(["--help"])
    assert opts.help is True
    assert opts.command is None


def test_version_short_circuit() -> None:
    """--version before a command → version=True."""
    opts = parse_args(["--version"])
    assert opts.version is True


def test_implied_init() -> None:
    """A bare non-command token → implied init with that token as the name."""
    opts = parse_args(["my-project"])
    assert opts.command == "init"
    assert opts.positional == ("my-project",)


def test_leading_flag_raises() -> None:
    """A leading unknown flag is still an error, not an implied init."""
    with pytest.raises(UsageError):
        parse_args(["--nope"])


def test_init_with_persona() -> None:
    """init foo --persona student → parsed into typed shape."""
    opts = parse_args(["init", "foo", "--persona", "student"])
    assert opts.command == "init"
    assert opts.positional == ("foo",)
    assert opts.persona == "student"


def test_integrations_csv() -> None:
    """--integrations graphify,obsidian → tuple of both."""
    opts = parse_args(["init", "p", "--integrations", "graphify,obsidian"])
    assert opts.integrations == ("graphify", "obsidian")


def test_unknown_integration_raises() -> None:
    """Unknown integration in the CSV → UsageError."""
    with pytest.raises(UsageError, match="unknown integration"):
        parse_args(["init", "p", "--integrations", "graphify,ghost"])


def test_force_and_dry_run() -> None:
    """Flag combinations propagate through."""
    opts = parse_args(["init", "p", "--force", "--dry-run"])
    assert opts.force is True
    assert opts.dry_run is True
