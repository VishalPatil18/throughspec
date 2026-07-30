"""Post-init checklist: the "what to do next" summary after scaffolding."""

from __future__ import annotations

from collections.abc import Sequence

from .args import Integration, Persona
from .integrations import INTEGRATION_REGISTRY, InstallResult

PERSONA_GUIDANCE: dict[Persona, str] = {
    "vibe": "Ship first. Ask Claude to explain any heavy step in one line before doing it - but never skip a required cross-question.",
    "student": 'After each phase, ask Claude "Why this step?" and append the answer to claude/learnings.md.',
    "engineer": "Read claude/context.md before Grep (cheaper), and log every non-trivial decision to claude/design-decisions.md.",
    "team": "Every PR runs the checklist in .github/pull_request_template.md; treat unresolved memory-file conflicts as blocking.",
}


def post_init_checklist(
    out_dir: str,
    persona: Persona | None,
    integrations: Sequence[Integration] = (),
    install_results: Sequence[InstallResult] = (),
    verb: str = "Scaffolded",
) -> str:
    """Return the post-init checklist as a string. `out_dir` is the scaffold path."""
    lines = ["", f"[OK] {verb} {out_dir}", ""]

    if persona:
        lines += [
            f"Persona: {persona}",
            f"  {PERSONA_GUIDANCE[persona]}",
            "  Change it any time with: spec-init customize --persona <name>",
            "",
        ]

    lines += [
        "Next steps:",
        f"  1. cd {out_dir}",
        "  2. Open the project in Claude Code",
        "  3. Run /spec-requirements to build claude/srs.md",
        "  4. Then /spec-design and /spec-plan",
        "",
    ]

    if integrations:
        lines.append("Integrations enabled:")
        for name in integrations:
            info = INTEGRATION_REGISTRY[name]
            res = next((r for r in install_results if r.name == name), None)
            tag = ""
            if res and res.status == "installed":
                tag = "  [installed]"
            elif res and res.status == "failed":
                tag = f"  [install failed - run: {res.command}]"
            elif res and res.status == "manual":
                tag = f"  [install: {res.command}]"
            lines.append(f"  - {info.title}{tag}")
            lines.append(f"    docs: {info.docs_url}")
        lines.append("")

    return "\n".join(lines)
