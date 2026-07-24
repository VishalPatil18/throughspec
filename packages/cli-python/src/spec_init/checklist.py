"""Post-init checklist (FR-INIT-04, NFR-USE-01)."""

from __future__ import annotations

from .args import Integration, Persona


def post_init_checklist(
    out_dir: str,
    persona: Persona | None,
    integrations: tuple[Integration, ...] = (),
) -> str:
    """Return the post-init checklist as a string."""
    lines = [
        "",
        f"[OK] Scaffolded {out_dir}",
        "",
        "Next steps:",
        f"  1. cd {out_dir}",
        "  2. Open the project in Claude Code",
        "  3. Run /spec-requirements to build claude/srs.md",
        "  4. Then /spec-design and /spec-plan",
        "",
    ]
    if persona == "student":
        lines.append(
            'Student mode: after each phase, ask Claude "Why this step?" and '
            "append to claude/learnings.md."
        )
        lines.append("")
    if "caveman" in integrations:
        lines.append(
            "Caveman enabled - install the skill once (free, local, no account):"
        )
        lines.append("  npx skills add JuliusBrussee/caveman")
        lines.append("Then use /caveman in Claude Code. See claude/caveman.md.")
        lines.append("")
    return "\n".join(lines)
