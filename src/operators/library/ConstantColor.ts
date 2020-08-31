import { DataType, Operator, Output, Parameter } from '..';
import { Expr } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { ShaderAssembly } from '../../render/ShaderAssembly';

class ConstantColor extends Operator {
  public readonly outputs: Output[] = [{
    id: 'out',
    name: 'Out',
    type: DataType.RGBA,
  }];
  public readonly params: Parameter[] = [
    {
      id: 'color',
      name: 'Color',
      type: DataType.RGBA,
      default: [1.0, 1.0, 1.0, 1.0],
    },
  ];
  public readonly description = `
A constant color.
`;

  constructor() {
    super('generator', 'Constant Color', 'generator_constant_color');
  }

  public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
    if (assembly.start(node)) {
      assembly.declareUniforms(this, node.id, this.params);
      assembly.finish(node);
    }

    return assembly.uniform(node, 'color');
  }
}

export default new ConstantColor();
