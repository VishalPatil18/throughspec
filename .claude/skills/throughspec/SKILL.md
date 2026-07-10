```markdown
# throughspec Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches the core development patterns and workflows used in the `throughspec` repository, a TypeScript-based project with multi-language CLI tooling and a strong focus on modular skills, agents, integrations, and documentation. The repository emphasizes clear, conventional commits, consistent code style, and robust testing using Playwright. Whether you're adding new skills, developing CLI tools, updating documentation, or integrating external services, this guide will help you follow project conventions and contribute effectively.

## Coding Conventions

**File Naming**
- Use `camelCase` for file names.
  - Example: `skillLoader.ts`, `userAgent.ts`

**Import Style**
- Use relative imports for internal modules.
  - Example:
    ```typescript
    import { loadSkill } from './skillLoader';
    ```

**Export Style**
- Use named exports.
  - Example:
    ```typescript
    // skillLoader.ts
    export function loadSkill(name: string) { ... }
    ```

**Commit Messages**
- Use [Conventional Commits](https://www.conventionalcommits.org/):
  - Prefixes: `feat`, `fix`
  - Example: `feat: add Obsidian integration`

## Workflows

### Add New Skill or Agent
**Trigger:** When introducing a new skill or agent to the system  
**Command:** `/add-skill-or-agent`

1. Create or update a `SKILL.md` (for skills) or agent markdown in `templates/.claude/skills/` or `templates/.claude/agents/`.
2. Mirror the new skill or agent in `packages/cli-python/src/spec_init/_payload/.claude/skills/` or `/agents/`.
3. Update or add relevant tests:
    - `tests/skills.test.ts`
    - `tests/agents.test.ts`
    - `tests/init.test.ts`
4. Update project documentation:
    - `claude/context.md`
    - `claude/learnings.md`
    - `claude/plan.md`

**Example:**
```bash
# Add a new skill
cp templates/.claude/skills/template/SKILL.md templates/.claude/skills/myNewSkill/SKILL.md
# Mirror to Python CLI payload
cp templates/.claude/skills/myNewSkill/SKILL.md packages/cli-python/src/spec_init/_payload/.claude/skills/myNewSkill/SKILL.md
```

---

### Scaffolding CLI Development
**Trigger:** When adding or enhancing a CLI tool for project scaffolding  
**Command:** `/scaffold-cli`

1. Add or update CLI source files (commands, args, persona, payload, etc.) in:
    - `packages/cli-node/src/`
    - `packages/cli-python/src/spec_init/`
2. Update CLI documentation and configuration:
    - `README.md`
    - `package.json` or `pyproject.toml`
3. Add or update tests for CLI commands and features.
4. Update project documentation:
    - `claude/context.md`
    - `claude/learnings.md`
    - `claude/plan.md`

**Example:**
```typescript
// packages/cli-node/src/commands/init.ts
export function initProject(args: InitArgs) { ... }
```

---

### Template and Docs Update
**Trigger:** When revising or fixing documentation templates or markdown files  
**Command:** `/update-docs`

1. Edit markdown files in `templates/` and `claude/` directories.
2. Update config files for issue templates or markdown linting (e.g., `.markdownlint.jsonc`).
3. Update related documentation in `tests/` or `tools/`.
4. Update project documentation:
    - `claude/context.md`
    - `claude/learnings.md`
    - `claude/plan.md`

**Example:**
```markdown
<!-- templates/.claude/skills/myNewSkill/SKILL.md -->
# My New Skill
Description and usage instructions...
```

---

### Website Feature Development
**Trigger:** When adding or updating website pages, UI components, or site configuration  
**Command:** `/website-feature`

1. Add or update page files in `website/app/`.
2. Update or add components in `website/components/`.
3. Edit or add supporting files in `website/lib/`, configuration, or styles.
4. Update `website/package.json` and related configs.
5. Update project documentation if needed:
    - `claude/context.md`
    - `claude/learnings.md`
    - `claude/plan.md`

**Example:**
```tsx
// website/components/NewFeature.tsx
export function NewFeature() {
  return <div>New Feature!</div>;
}
```

---

### Integration Feature Addition
**Trigger:** When introducing or updating an integration with an external tool or platform  
**Command:** `/add-integration`

1. Add or update integration config files in `templates/_integrations/`.
2. Mirror integration files in `packages/cli-python/src/spec_init/_payload/_integrations/`.
3. Update CLI integration logic in `packages/cli-node` or `packages/cli-python`.
4. Add or update tests for integrations.
5. Update project documentation:
    - `claude/context.md`
    - `claude/learnings.md`
    - `claude/plan.md`
6. Update or add supporting tools/scripts as needed.

**Example:**
```typescript
// packages/cli-node/src/integrations.ts
export function addGraphifyIntegration(config: IntegrationConfig) { ... }
```

---

## Testing Patterns

- **Framework:** [Playwright](https://playwright.dev/)
- **Test files:** Use the `*.test.ts` pattern.
- **Placement:** Tests are located in the `tests/` directory and relevant subdirectories.
- **Example:**
    ```typescript
    // tests/skills.test.ts
    import { test, expect } from '@playwright/test';
    import { loadSkill } from '../packages/cli-node/src/skillLoader';

    test('should load skill correctly', async () => {
      const skill = await loadSkill('myNewSkill');
      expect(skill).toBeDefined();
    });
    ```

## Commands

| Command                | Purpose                                                         |
|------------------------|-----------------------------------------------------------------|
| /add-skill-or-agent    | Add a new skill or agent, update templates and CLI payloads     |
| /scaffold-cli          | Scaffold or update CLI tools and commands                       |
| /update-docs           | Revise documentation templates or markdown files                |
| /website-feature       | Add or update website features, pages, or components            |
| /add-integration       | Add or update integration features and supporting logic         |
```
