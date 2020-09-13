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
  }
}

// Greedy line-breaking algorithm.
function greedyWrap(out: PrintStream, fragments: OutputChunk[]) {
  const saveIndent = out.getIndentLevel();
  fragments.forEach((fragment, index) => {
    if (out.canFit(chunkLength(fragment))) {
      out.append(flatten(fragment));
    } else if (typeof fragment === 'string') {
      if (index > 0) {
        out.setIndentLevel(saveIndent + 1);
      }
      out.breakLine();
      out.append(fragment);
    } else {
      emit(out, fragment);
    }
  })
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

// function chunkHeadLength(chunk: OutputChunk | OutputChunk[]): number {
//   if (typeof chunk === 'string') {
//     return chunk.length;
//   } else if (Array.isArray(chunk)) {
//     return chunkLength(chunk[0]);
//   } else {
//     switch (chunk.type) {
//       case 'parens':
//       case 'brackets':
//         return 1;

//       case 'fcall':
//         return chunkLength(chunk.fragments[0]) + 1;

//       case 'flat':
//         return chunkLength(chunk.fragments);

//       case 'infix': {
//         const [oper, ...args] = chunk.fragments;
//         return chunkLength(args[0]) + chunkLength(oper);
//       }

//       case 'stmt':
//         return chunkHeadLength(chunk.fragments);
//     }
//   }
// }

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
