import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { ShaderAssembly } from '../../render/ShaderAssembly';

class CrossFade extends Operator {
  public readonly inputs: Input[] = [{
    id: 'in',
    name: 'In',
    type: DataType.RGBA,
    buffered: true,
  }];
  public readonly outputs: Output[] = [{
    id: 'out',
    name: 'Out',
    type: DataType.RGBA,
  }];
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

  public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
    if (assembly.start(node)) {
      assembly.declareUniforms(this, node.id, this.params);
      assembly.addBufferUniform(this, node.id, 'in');
      assembly.addCommon('crossfade');
      assembly.finish(node);
    }

    return assembly.call(
      'crossfade', [
        assembly.literal(this.uniformName(node.id, 'in'), DataType.IMAGE),
        assembly.uniform(node, 'x_overlap'),
        assembly.uniform(node, 'y_overlap'),
        uv,
      ], DataType.RGBA);
  }
}

export default new CrossFade();
