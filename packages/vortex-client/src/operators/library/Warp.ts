import { DataType, Input, Operator, Output, Parameter } from '..';
import {
  ExprNode,
  add,
  fork,
  getAttr,
  literal,
  multiply,
  refInput,
  refTexCoords,
  refUniform,
  subtract,
} from '../../render/ExprNode';
import { GraphNode } from '../../graph';

class Warp extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'in',
      name: 'In',
      type: DataType.VEC4,
    },
    {
      id: 'duv',
      name: 'dUV',
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
      id: 'intensity',
      name: 'Intensity',
      type: DataType.FLOAT,
      min: 0,
      max: 1,
      precision: 2,
      increment: 0.01,
      default: 0.05,
    },
  ];

  public readonly description = `Dispaces the input pixels based on the normal vector of the displacement input.`;

  constructor() {
    super('transform', 'Warp', 'transform_warp');
  }

  public getCode(node: GraphNode): ExprNode {
    const intensity = refUniform('intensity', DataType.FLOAT, node);
    const iuv = fork(refTexCoords(), 'uv');
    const duv = refInput('duv', DataType.VEC4, node, iuv);
    return refInput(
      'in',
      DataType.VEC4,
      node,
      add(
        iuv,
        multiply(
          multiply(
            subtract(
              getAttr(duv, 'xy', DataType.VEC2),
              literal('0.5', DataType.VEC2),
              DataType.VEC2
            ),
            literal('vec2(1.0, -1.0)', DataType.VEC2),
            DataType.VEC2
          ),
          intensity,
          DataType.VEC2
        ),
        DataType.VEC2
      )
    );
  }
}

export default new Warp();