/** Line-wrapping styles:

    * list - break before each list element
    * flat - prefer to break in as few places as possible.
    * right - prefer to break the right side before the left.
 */
type ChunkType = 'parens' | 'brackets' | 'fcall' | 'flat' | 'infix' | 'stmt';

/** A string tree is a set of nested arrays containing strings. The arrays represent
    potential points where line-wrapping can occur. So for example:

      [['A', ' = '], 'B']

    This indicates that a breakpoint after the '=' is preferable to a breakpoint before
    the '=' since it is higher up in the tree.
 */
export type OutputChunk = string | { type: ChunkType; fragments: OutputChunk[] };

export const parens = (...fragments: OutputChunk[]): OutputChunk => ({
  type: 'parens',
  fragments,
});

export const brackets = (...fragments: OutputChunk[]): OutputChunk => ({
  type: 'brackets',
  fragments,
});

export const flat = (...fragments: OutputChunk[]): OutputChunk => ({
  type: 'flat',
  fragments,
});

export const fcall = (fn: OutputChunk, args: OutputChunk[]): OutputChunk => ({
  type: 'fcall',
  fragments: [fn, ...args],
});

export const infix = (oper: string, ...args: OutputChunk[]): OutputChunk => ({
  type: 'infix',
  fragments: [oper, ...args],
});

export const stmt = (arg: OutputChunk): OutputChunk => ({
  type: 'stmt',
  fragments: [arg],
});
