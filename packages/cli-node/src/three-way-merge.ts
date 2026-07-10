// Three-way text merge, git-style conflict markers.
//
// Delegates the diff to `node-diff3.diff3Merge`, which returns either a run
// of clean text or a `conflict` block. We render conflicts as the same
// `<<<<<<<`/`=======`/`>>>>>>>` fences git uses so users have muscle memory.

import { diff3Merge } from 'node-diff3';

export interface MergeResult {
  merged: string;
  hasConflict: boolean;
}

/** Merge `ours` and `theirs` against a common `base`. */
export function threeWayMerge(base: string, ours: string, theirs: string): MergeResult {
  const toLines = (s: string): string[] => s.split('\n');
  const result = diff3Merge(toLines(ours), toLines(base), toLines(theirs), {
    stringSeparator: '\n',
  });

  const chunks: string[] = [];
  let hasConflict = false;

  for (const region of result) {
    if ('ok' in region && region.ok) {
      chunks.push(region.ok.join('\n'));
    } else if ('conflict' in region && region.conflict) {
      hasConflict = true;
      const { a, b } = region.conflict;
      chunks.push(
        [
          '<<<<<<< ours',
          a.join('\n'),
          '=======',
          b.join('\n'),
          '>>>>>>> theirs',
        ].join('\n'),
      );
    }
  }

  return { merged: chunks.join('\n'), hasConflict };
}
