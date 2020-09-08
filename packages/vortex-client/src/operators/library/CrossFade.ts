import { DataType, Input, Operator, Output, Parameter } from '..';
import { ExprNode, defineFn, literal, refTexCoords, refUniform } from '../../render/ExprNode';
import { GraphNode } from '../../graph';

const IMPORTS = new Set(['crossfade']);

export const crossfade = defineFn({
  name: 'crossfade',
  result: DataType.VEC4,
  args: [DataType.IMAGE, DataType.FLOAT, DataType.FLOAT, DataType.VEC2],
});

class CrossFade extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'in',
      name: 'In',
      type: DataType.VEC4,
      buffered: true,
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
      id: 'x_overlap',
      name: 'X Overlap',
      type: DataType.FLOAT,
      min: 0,
      max: 100,
      default: 20,
      precision: 1,
    },
    {
      id: 'y_overlap',
      name: 'Y Overlap',
      type: DataType.FLOAT,
      min: 0,
      max: 100,
      default: 20,
      precision: 1,
    },
  ];

  public readonly description = `Makes non-repeating images repeatable by cross-fading edges.`;

  constructor() {
    super('transform', 'Cross-Fade', 'transform_cross_fade');
  }

  public getImports(node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): ExprNode {
    if (!node.getInputTerminal('in').connection) {
      return literal('vec4(0.0, 0.0, 0.0, 0.0)', DataType.VEC4);
    }
    return crossfade(
      refUniform('in', DataType.IMAGE, node),
      refUniform('x_overlap', DataType.FLOAT, node),
      refUniform('y_overlap', DataType.FLOAT, node),
      refTexCoords()
    );
  }
}

export default new CrossFade();
