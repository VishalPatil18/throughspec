"""Throughspec spec-init (Python CLI)."""

from importlib.metadata import PackageNotFoundError, version

# Single source of truth: the installed package metadata (from pyproject.toml).
try:
    __version__ = version("spec-init")
except PackageNotFoundError:  # not installed (e.g. running from a bare source tree)
    __version__ = "0.0.0"
