import { printToString } from './print';
import { flat, parens, fcall, infix, stmt } from '../OutputChunk';

describe('print', () => {
  test('flat', () => {
    expect(printToString(flat(';'), 16)).toBe(`  ;`);
    expect(printToString(flat('x', ' = ', 'y', ';'), 16)).toBe(`  x = y;`);
  });

  test('parens', () => {
    expect(printToString(parens(';'), 16)).toBe(`  (;)`);
    expect(printToString(parens('x', ' = ', 'y', ';'), 16)).toBe(`  (x = y;)`);
  });

  test('fcall', () => {
    expect(printToString(fcall('x', []), 16)).toBe(`  x()`);
    expect(printToString(fcall('x', ['y', 'y', 'z']), 16)).toBe(`  x(y, y, z)`);
  });

  test('infix', () => {
    expect(printToString(infix('+', 'x'), 16)).toBe(`  x`);
    expect(printToString(infix('+', 'x', 'y', 'z'), 16)).toBe(`  x + y + z`);
    expect(printToString(infix('+', 'x123456789', 'y123456789'), 16)).toBe(
      `  x123456789 +
    y123456789`
    );
  });

  test('fcall', () => {
    expect(printToString(stmt('x'), 16)).toBe(`  x;`);
  });
});
