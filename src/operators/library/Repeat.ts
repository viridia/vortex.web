import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { ShaderAssembly } from '../../render/ShaderAssembly';

class Repeat extends Operator {
  public readonly inputs: Input[] = [{
    id: 'in',
    name: 'In',
    type: DataType.RGBA,
  }];
  public readonly outputs: Output[] = [{
    id: 'out',
    name: 'Out',
    type: DataType.RGBA,
  }];
  public readonly params: Parameter[] = [
    {
      id: 'count_x',
      name: 'Count X',
      type: DataType.INTEGER,
      min: 1,
      max: 16,
      default: 2,
    },
    {
      id: 'count_y',
      name: 'Count Y',
      type: DataType.INTEGER,
      min: 1,
      max: 16,
      default: 2,
    },
  ];

  public readonly description = `Produces a tiled copy of the input.`;

  constructor() {
    super('transform', 'Repeat', 'transform_repeat');
  }

  public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
    if (assembly.start(node)) {
      assembly.declareUniforms(this, node.id, this.params);
      assembly.finish(node);
    }

    const countX = this.uniformName(node.id, 'count_x');
    const countY = this.uniformName(node.id, 'count_y');
    const tuv = `${this.localPrefix(node.id)}_uv`;
    assembly.assign(tuv, 'vec2', uv);
    return assembly.readInputValue(
        node, 'in',
        assembly.literal(
            `vec2(fract(${tuv}.x * float(${countX})), fract(${tuv}.y * float(${countY})))`,
            DataType.UV));
  }
}

export default new Repeat();
