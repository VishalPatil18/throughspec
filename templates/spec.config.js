// spec.config.js - Throughspec project configuration.
//
// This is the single ground-truth config for your project. Claude reads it at
// the start of every session (see CLAUDE.md section 2) and honors it, and the
// CLI reads the managed block below to know your persona and active
// integrations. It is preserved verbatim across `spec-init upgrade` - your
// settings are never overwritten.
//
// Edit it freely. The CLI only rewrites the fields inside the
// `spec-init:managed` markers; everything else is yours.

module.exports = {
  // --- Managed by spec-init ------------------------------------------------
  // Persona + active integrations. Change them with the CLI:
  //   spec-init customize --persona <p>          (vibe | student | engineer | team)
  //   spec-init customize --add|--remove <name>  (an integration)
  // You may also edit the two fields directly - the CLI reads this block.
  // <spec-init:managed>
  persona: 'engineer',
  integrations: [],
  // </spec-init:managed>

  // --- Skills -------------------------------------------------------------
  // Every shipped skill is available by default. List the names of any skills
  // Claude should NOT use in this project (Claude will avoid invoking them).
  skills: {
    disabled: [
      // 'spec-market-research',
      // 'spec-ux',
    ],
  },

  // --- Workflow -----------------------------------------------------------
  workflow: {
    // The mandatory SDLC phase order. Claude will not write production code
    // until the phases a feature depends on are complete.
    phases: ['requirements', 'design', 'plan', 'feature'],
    // Allow skipping a phase WITHOUT logging an override in
    // claude/design-decisions.md? Keep false to preserve the spec-driven
    // guarantee that nothing is built ahead of its spec.
    allowSkip: false,
  },

  // --- Settings -----------------------------------------------------------
  settings: {
    // End file-changing responses with a suggested Conventional Commits message
    // (the commit invariant in CLAUDE.md section 2). Set false to turn it off.
    commitSuggestions: true,
    // Freeform, project-wide rules Claude must follow. These are honored the
    // same as CLAUDE.md section 7's custom instructions.
    customInstructions: [
      // 'Prefer Drizzle over Prisma.',
      // 'Never use class components in React.',
    ],
  },
};
