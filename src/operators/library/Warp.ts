import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { ShaderAssembly } from '../../render/ShaderAssembly';

class Warp extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'in',
      name: 'In',
      type: DataType.RGBA,
    },
    {
      id: 'duv',
      name: 'dUV',
      type: DataType.XYZW,
    }];
  public readonly outputs: Output[] = [{
    id: 'out',
    name: 'Out',
    type: DataType.RGBA,
  }];
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

  public readonly description =
    `Dispaces the input pixels based on the normal vector of the displacement input.`;

  constructor() {
    super('transform', 'Warp', 'transform_warp');
  }

  public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
    if (assembly.start(node)) {
      assembly.declareUniforms(this, node.id, this.params);
      assembly.finish(node);
    }

    const intensity = this.uniformName(node.id, 'intensity');
    const iuv = `${this.localPrefix(node.id)}_uv`;
    assembly.assign(iuv, 'vec2', uv);
    const duv = `${this.localPrefix(node.id)}_duv`;
    assembly.assign(duv, 'vec4', assembly.readInputValue(node, 'duv', uv));

    return assembly.readInputValue(
        node, 'in',
        assembly.literal(
            `${iuv} + (${duv}.xy - 0.5) * vec2(1.0, -1.0) * ${intensity}`,
            DataType.UV));
  }
}

export default new Warp();
