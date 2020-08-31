import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { ShaderAssembly } from '../../render/ShaderAssembly';

class Blur extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'in',
      name: 'In',
      type: DataType.RGBA,
      buffered: true,
    },
  ];
  public readonly outputs: Output[] = [
    {
      id: 'out',
      name: 'Out',
      type: DataType.RGBA,
    },
  ];
  public readonly params: Parameter[] = [
    {
      id: 'radius',
      name: 'Radius',
      type: DataType.FLOAT,
      min: 0.01,
      max: 0.1,
      default: 0.05,
    },
  ];

  public readonly description = `
Gaussian blur operator.

**Caution**: This operator is fairly slow. There are faster blur algorithms, however this one is
designed to scale with the size of the input, which requires a large amount of sampling.
`;

  constructor() {
    super('filter', 'Blur', 'filter_blur');
  }

  public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
    if (assembly.start(node)) {
      assembly.declareUniforms(this, node.id, this.params);
      assembly.addBufferUniform(this, node.id, 'in');
      assembly.addCommon('blur');
      assembly.finish(node);
    }

    return assembly.call(
      'blur',
      [
        assembly.literal(this.uniformName(node.id, 'in'), DataType.IMAGE),
        assembly.uniform(node, 'radius'),
        uv,
      ],
      DataType.RGBA
    );
  }
}

export default new Blur();
