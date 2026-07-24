"""Integration-strip parity vs tools/strip-integrations.mjs plus a Python-side
toggle-roundtrip that mirrors tests/integrations.test.ts."""

from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

from spec_init.integrations import strip_integrations

REPO_ROOT = Path(__file__).resolve().parents[3]
STRIP_MJS = REPO_ROOT / "tools" / "strip-integrations.mjs"
FIXTURES = (
    REPO_ROOT / "templates" / "CLAUDE.md",
    REPO_ROOT / "templates" / "README.md",
    REPO_ROOT / "templates" / "claude" / "srs.md",
    REPO_ROOT / "templates" / "design" / "design.md",
)
ACTIVE_SETS = (
    (),
    ("graphify",),
    ("obsidian",),
    ("caveman",),
    ("graphify", "obsidian", "caveman"),
)

# Payload marker file written by each integration, relative to the project root.
INTEGRATION_MARKER_FILE = {
    "graphify": ".graphify/config.yml",
    "obsidian": ".obsidian/workspace.json",
    "caveman": "claude/caveman.md",
}


def _has_node() -> bool:
    return shutil.which("node") is not None


@pytest.mark.skipif(not _has_node(), reason="node not installed; skipping parity test")
@pytest.mark.parametrize("fixture", FIXTURES)
@pytest.mark.parametrize("active", ACTIVE_SETS)
def test_python_matches_mjs(
    fixture: Path, active: tuple[str, ...]
) -> None:
    """Python strip_integrations output matches the .mjs source byte-for-byte."""
    py_out = strip_integrations(fixture.read_text(encoding="utf-8"), active)  # type: ignore[arg-type]
    mjs_result = subprocess.run(
        [
            "node",
            str(STRIP_MJS),
            "--active",
            ",".join(active),
            "--in",
            str(fixture),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    assert py_out == mjs_result.stdout


def test_unknown_integration_raises() -> None:
    with pytest.raises(ValueError, match="unknown integration"):
        strip_integrations("<!-- integration:ghost -->x<!-- /integration:ghost -->", ())


def _fingerprint(root: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    for path in sorted(root.rglob("*")):
        if path.is_file():
            rel = path.relative_to(root).as_posix()
            out[rel] = hashlib.sha256(path.read_bytes()).hexdigest()
    return out


def _run_cli(cwd: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-m", "spec_init", *args],
        cwd=str(cwd),
        capture_output=True,
        text=True,
    )


def _assert_roundtrip_empty(before: dict[str, str], after: dict[str, str]) -> None:
    skip = {".spec-init/meta.json"}
    missing = sorted(k for k in before if k not in after and k not in skip)
    extra = sorted(k for k in after if k not in before and k not in skip)
    changed = sorted(
        k for k in before if k in after and after[k] != before[k] and k not in skip
    )
    assert (missing, extra, changed) == ([], [], [])


@pytest.mark.parametrize("name", ("graphify", "obsidian", "caveman"))
def test_toggle_roundtrip_leaves_zero_residual(tmp_path: Path, name: str) -> None:
    r = _run_cli(tmp_path, "init", "p", "--persona", "engineer")
    assert r.returncode == 0, r.stderr
    project = tmp_path / "p"
    before = _fingerprint(project)

    add = _run_cli(project, "customize", "--add", name)
    assert add.returncode == 0, add.stderr
    assert (project / INTEGRATION_MARKER_FILE[name]).exists()

    rm = _run_cli(project, "customize", "--remove", name)
    assert rm.returncode == 0, rm.stderr
    _assert_roundtrip_empty(before, _fingerprint(project))


def test_meta_reflects_active_set(tmp_path: Path) -> None:
    r = _run_cli(tmp_path, "init", "p", "--persona", "engineer", "--integrations", "graphify")
    assert r.returncode == 0, r.stderr
    project = tmp_path / "p"
    meta = json.loads((project / ".spec-init" / "meta.json").read_text(encoding="utf-8"))
    assert meta["integrations"] == ["graphify"]

    add = _run_cli(project, "customize", "--add", "obsidian")
    assert add.returncode == 0, add.stderr
    meta = json.loads((project / ".spec-init" / "meta.json").read_text(encoding="utf-8"))
    assert sorted(meta["integrations"]) == ["graphify", "obsidian"]
