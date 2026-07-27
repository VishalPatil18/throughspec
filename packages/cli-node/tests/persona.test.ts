import { describe, expect, it } from 'vitest';
import { stampPersona } from '../src/persona';

const TEMPLATE = '// active-persona: <none>   // managed by spec-init - change via `spec-init customize --persona`\n\nmodule.exports = {};\n';

describe('stampPersona', () => {
  it('stamps a persona into the managed line', () => {
    const out = stampPersona(TEMPLATE, 'student');
    expect(out).toContain('// active-persona: student   // managed by spec-init');
    expect(out).toContain('module.exports = {};');
  });

  it('replaces an existing value (idempotent-ish)', () => {
    const stamped = stampPersona(TEMPLATE, 'student');
    const restamped = stampPersona(stamped, 'engineer');
    expect(restamped).toContain('// active-persona: engineer   // managed by spec-init');
    expect(restamped).not.toContain('active-persona: student');
  });

  it('leaves text without the managed line untouched', () => {
    expect(stampPersona('module.exports = {};\n', 'team')).toBe('module.exports = {};\n');
  });
});
