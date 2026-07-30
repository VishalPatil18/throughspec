import { describe, expect, it } from 'vitest';
import { parseArgs } from '../src/args';

describe('parseArgs shorthand', () => {
  it('treats a bare non-command token as implied init', () => {
    const opts = parseArgs(['my-project']);
    expect(opts.command).toBe('init');
    expect(opts.positional).toEqual(['my-project']);
  });

  it('still parses an explicit init command', () => {
    const opts = parseArgs(['init', 'my-project', '--persona', 'student']);
    expect(opts.command).toBe('init');
    expect(opts.positional).toEqual(['my-project']);
    expect(opts.persona).toBe('student');
  });

  it('leaves command null when no args are given', () => {
    const opts = parseArgs([]);
    expect(opts.command).toBeNull();
  });

  it('rejects a single-dash leading token instead of implying init', () => {
    expect(() => parseArgs(['-persona', 'student'])).toThrow();
  });
});
