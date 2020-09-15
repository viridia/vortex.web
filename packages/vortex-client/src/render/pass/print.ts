import { OutputChunk } from '../OutputChunk';
import { PrintStream } from '../PrintStream';

export function printToString(chunk: OutputChunk, maxWidth: number) {
  const ps = new PrintStream();
  ps.setMaxLineLength(maxWidth);
  ps.setNextLineIndent(1);
  emit(ps, chunk);
  ps.breakLine();
  return ps.toString();
}

export function print(out: PrintStream, chunk: OutputChunk) {
  out.setNextLineIndent(1);
  emit(out, chunk);
  out.breakLine();
}

export function emit(out: PrintStream, chunk: OutputChunk) {
  if (typeof chunk === 'string' || out.canFit(chunkLength(chunk))) {
    // No need for break, line will fit
    out.append(flatten(chunk));
  } else {
    const saveIndent = out.getNextLineIndent();
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

        // If the call only has one argument, and the argument will fit if broken,
        // then don't break, let the argument break instead.
        console.log(flatten(args[0]));
        console.log(chunkHeadLength(args[0]));
        if (args.length === 1 && out.canFit(chunkHeadLength(args[0]))) {
          emit(out, args[0]);
          out.append(')');
          break;
        }

        args.forEach((arg, index) => {
          if (args.length > 1) {
            out.setNextLineIndent(saveIndent + 1);
            out.breakLine();
          }
          emit(out, arg);
          if (index < args.length - 1) {
            out.append(', ');
          }
        });
        out.setNextLineIndent(saveIndent);
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

        // Special case where 1st argument and operator and part of second argument can
        // fit on one line.
        if (args.length === 2 && out.canFit(chunkLength(args[0]) + 3 + chunkHeadLength(args[1]))) {
          emit(out, args[0]);
          emit(out, ` ${oper} `);
          emit(out, args[1]);
          break
        }

        args.forEach((arg, index) => {
          if (index > 0) {
            emit(out, ` ${oper} `);
          }
          if (!out.canFit(chunkLength(arg))) {
            out.setNextLineIndent(saveIndent + 1);
            out.breakLine();
          }
          emit(out, arg);
        });
        out.setNextLineIndent(saveIndent);
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
  const saveIndent = out.getNextLineIndent();
  fragments.forEach((fragment, index) => {
    if (out.canFit(chunkLength(fragment))) {
      out.append(flatten(fragment));
    } else if (typeof fragment === 'string') {
      if (index > 0) {
        out.setNextLineIndent(saveIndent + 1);
      }
      out.breakLine();
      out.append(fragment);
    } else {
      emit(out, fragment);
    }
  })
  out.setNextLineIndent(saveIndent);
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
