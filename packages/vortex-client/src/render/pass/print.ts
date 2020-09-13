import { OutputChunk } from '../OutputChunk';
import { PrintStream } from '../PrintStream';

export function printToString(chunk: OutputChunk, maxWidth: number) {
  const ps = new PrintStream();
  ps.setMaxLineLength(maxWidth);
  ps.setIndentLevel(1);
  emit(ps, chunk);
  ps.breakLine();
  return ps.toString();
}

export function print(out: PrintStream, chunk: OutputChunk) {
  out.setIndentLevel(1);
  emit(out, chunk);
  out.breakLine();
}

export function emit(out: PrintStream, chunk: OutputChunk) {
  if (typeof chunk === 'string' || out.canFit(chunkLength(chunk))) {
    // No need for break, line will fit
    out.append(flatten(chunk));
  } else {
    const saveIndent = out.getIndentLevel();
    switch (chunk.type) {
      case 'parens':
        out.append('(');
        greedyWrap(out, chunk.fragments);
        out.append(')');
        break;

      case 'brackets':
        out.append('[');
        greedyWrap(out, chunk.fragments);
        out.append(']');
        break;

      case 'fcall':
        const [fn, ...args] = chunk.fragments;
        emit(out, fn);
        out.append('(');
        args.forEach((arg, index) => {
          if (args.length > 1) {
            out.setIndentLevel(saveIndent + 1);
            out.breakLine();
          }
          emit(out, arg);
          if (index < args.length - 1) {
            out.append(', ');
          }
        });
        out.setIndentLevel(saveIndent);
        if (args.length > 1) {
          out.breakLine();
        }
        out.append(')');
        break;

      case 'flat':
        greedyWrap(out, chunk.fragments);
        break;

      case 'infix': {
        const [oper, ...args] = chunk.fragments;
        args.forEach((arg, index) => {
          if (index > 0) {
            emit(out, ` ${oper} `);
          }
          if (!out.canFit(chunkLength(arg))) {
            out.setIndentLevel(saveIndent + 1);
            out.breakLine();
          }
          emit(out, arg);
        });
        out.setIndentLevel(saveIndent);
        break;
      }

      case 'stmt':
        greedyWrap(out, chunk.fragments);
        out.append(';');
        break;
    }

    // // switch (in)
    // // if (chunk.fragments.length > 0) {

    // // || indent * 2 + chunkLength(chunk) <= MAX_COLS
    // if (chunk.type === 'fcall') {
    //   // Just break at every fragment.
    //   let wrapIndent = indent;
    //   chunk.fragments.forEach(elt => {
    //     emit(out, elt, wrapIndent);
    //     wrapIndent = indent + 1;
    //   });
    // } else if (chunk.type === 'flat') {
    //   greedyWrap(out, chunk.fragments, indent);
    // } else {
    //   const [left, right] = chunk.fragments;
    //   let leftLength = chunkLength(left);
    //   if (leftLength + indent * 2 > MAX_COLS || typeof right === 'string') {
    //     // Left side won't fit, fall back to greedy. Or right side can't be broken.
    //     const joined = [
    //       ...(typeof left === 'string' ? [left] : left.fragments),
    //       ...(typeof right === 'string' ? [right] : right.fragments),
    //     ];
    //     greedyWrap(out, joined, indent);
    //   } else {
    //     // This is kind of like greedywrap, except that we keep adding to the left.
    //     const head: OutputChunk[] = [...typeof left === 'string' ? [left] : left.fragments];
    //     let index = 0;
    //     while (index < right.fragments.length) {
    //       const fragLength = chunkLength(right.fragments[index]);
    //       if (leftLength + fragLength + indent * 2 > MAX_COLS) {
    //         break;
    //       }
    //       head.push(right.fragments[index]);
    //       leftLength += fragLength;
    //       index += 1;
    //       if (right.type === 'parens') {
    //         // If right is list style, only allow the first fragment to be joined with left.
    //         break;
    //       }
    //     }
    //     out.push('  '.repeat(indent) + flatten(head).trim());
    //     greedyWrap(out, right.fragments.slice(index), indent + 1);
    //   }
    // }
  }
}

// Greedy line-breaking algorithm.
function greedyWrap(out: PrintStream, fragments: OutputChunk[]) {
  const saveIndent = out.getIndentLevel();
  let index = 0;
  while (index < fragments.length) {
    const fragment = fragments[index];
    if (out.canFit(chunkLength(fragment))) {
      out.append(flatten(fragment));
      index += 1;
    } else if (typeof fragment === 'string') {
      if (index > 0) {
        out.setIndentLevel(saveIndent + 1);
      }
      out.breakLine();
      out.append(fragment);
      if (index > 0) {
        out.setIndentLevel(saveIndent + 1);
      }
      index += 1;
    } else {
      emit(out, fragment);
      index += 1;
    }

    // let lineEnd = lineStart;
    // let lineLength = 0;
    // while (lineEnd < fragments.length) {
    //   const fragLength = chunkLength(fragments[lineEnd]);
    //   if (!canFit(wrapIndent, lineLength + fragLength)) {
    //     // Fragment won't fit on the line, break at this point.
    //     break;
    //   }

    //   // Fragment will fit, keep going.
    //   lineEnd += 1;
    //   lineLength += fragLength;
    // }

    // if (lineEnd === lineStart) {
    //   // Couldn't fit any fragments
    //   const [first, ...rest] = fragments.slice(lineStart);
    //   if (typeof first === 'string') {
    //     // First fragment is too big, recurse.
    //     out.append(first.trim());
    //     lineStart += 1;
    //   } else {
    //     const line = [...first.fragments, ...rest];
    //     greedyWrap(out, line, wrapIndent);
    //     lineStart = fragments.length;
    //   }
    // } else {
    //   out.push('  '.repeat(wrapIndent) + flatten(fragments.slice(lineStart, lineEnd)).trim());
    //   lineStart = lineEnd;
    // }

    // wrapIndent = indent + 1;
  }
  out.setIndentLevel(saveIndent);
}

function chunkLength(chunk: OutputChunk | OutputChunk[]): number {
  if (typeof chunk === 'string') {
    return chunk.length;
  } else if (Array.isArray(chunk)) {
    return chunk.reduce((acc: number, elt) => {
      return acc + chunkLength(elt);
    }, 0);
  } else {
    switch (chunk.type) {
      case 'parens':
        return chunkLength(chunk.fragments) + 2;

      case 'brackets':
      case 'fcall':
        return chunkLength(chunk.fragments) + 2 * chunk.fragments.length;

      case 'flat':
        return chunkLength(chunk.fragments);

      case 'infix': {
        const [oper, ...args] = chunk.fragments;
        return chunkLength(args) + (chunk.fragments.length - 1) * (chunkLength(oper) + 2);
      }

      case 'stmt':
        return chunkLength(chunk.fragments);
    }
  }
}

function chunkHeadLength(chunk: OutputChunk | OutputChunk[]): number {
  if (typeof chunk === 'string') {
    return chunk.length;
  } else if (Array.isArray(chunk)) {
    return chunkLength(chunk[0]);
  } else {
    switch (chunk.type) {
      case 'parens':
      case 'brackets':
        return 1;

      case 'fcall':
        return chunkLength(chunk.fragments[0]) + 1;

      case 'flat':
        return chunkLength(chunk.fragments);

      case 'infix': {
        const [oper, ...args] = chunk.fragments;
        return chunkLength(args[0]) + chunkLength(oper);
      }

      case 'stmt':
        return chunkHeadLength(chunk.fragments);
    }
  }
}

function flatten(chunk: OutputChunk | OutputChunk[]): string {
  if (typeof chunk === 'string') {
    return chunk;
  } else if (Array.isArray(chunk)) {
    return chunk.map(flatten).join('');
  } else {
    switch (chunk.type) {
      case 'parens':
        return ['(', ...flatten(chunk.fragments), ')'].join('');

      case 'brackets':
        return ['[', chunk.fragments.map(frag => flatten(frag)).join(', '), ']'].join('');

      case 'fcall': {
        const [fn, ...args] = chunk.fragments;
        return [fn, '(', args.map(flatten).join(', '), ')'].join('');
      }

      case 'flat':
        return chunk.fragments.map(flatten).join('');

      case 'infix': {
        const [oper, ...args] = chunk.fragments;
        return args.map(flatten).join(` ${oper} `);
      }

      case 'stmt': {
        return chunk.fragments.map(flatten).join('') + ';';
      }
    }
  }
}
