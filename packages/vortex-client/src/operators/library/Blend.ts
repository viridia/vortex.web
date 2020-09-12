import { DataType, Input, Operator, Output, Parameter } from '..';
import {
  Expr,
  defineFn,
  fork,
  refInput,
  refTexCoords,
  refUniform,
} from '../../render/Expr';
import { GraphNode } from '../../graph';

const IMPORTS = new Set(['blend']);

export const blend = defineFn({
  name: 'blend',
  result: DataType.VEC4,
  args: [DataType.VEC4, DataType.VEC4, DataType.INTEGER, DataType.FLOAT, DataType.INTEGER],
});

class Blend extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'a',
      name: 'A',
      type: DataType.VEC4,
    },
    {
      id: 'b',
      name: 'B',
      type: DataType.VEC4,
    },
  ];
  public readonly outputs: Output[] = [
    {
      id: 'out',
      name: 'Out',
      type: DataType.VEC4,
    },
  ];
  public readonly params: Parameter[] = [
    {
      id: 'op',
      name: 'Operator',
      type: DataType.INTEGER,
      enumVals: [
        { name: 'Replace', value: 0 },
        { name: 'Add', value: 1 },
        { name: 'Subtract', value: 2 },
        { name: 'Multiply', value: 3 },
        { name: 'Difference', value: 4 },
        { name: 'Lighten', value: 10 },
        { name: 'Darken', value: 11 },
        { name: 'Screen', value: 20 },
        { name: 'Overlay', value: 21 },
        { name: 'Color Dodge', value: 22 },
        { name: 'Color Burn', value: 23 },
      ],
      default: 1,
    },
    {
      id: 'strength',
      name: 'Strength',
      type: DataType.FLOAT,
      min: 0,
      max: 1,
      default: 1,
    },
    {
      id: 'norm',
      name: 'Normalize',
      type: DataType.INTEGER,
      enumVals: [
        { name: 'Off', value: 0 },
        { name: 'On', value: 1 },
      ],
      default: 1,
    },
  ];
  public readonly description = `
Blends two source images, similar to layer operations in GIMP or PhotoShop.
* **operator** determines the formula used to blend the two images.
* **strength** affects how much of the original image shows through.
* **normalize** controls whether the result is clamped to a [0..1] range.
`;

  constructor() {
    super('filter', 'Blend', 'filter_blend');
  }

  public getImports(node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    const tuv = fork(refTexCoords(), 'uv');
    return blend(
        refInput('a', DataType.VEC4, node, tuv),
        refInput('b', DataType.VEC4, node, tuv),
        refUniform('op', DataType.INTEGER, node),
        refUniform('strength', DataType.FLOAT, node),
        refUniform('norm', DataType.INTEGER, node)
      );
  }
}

export default new Blend();
