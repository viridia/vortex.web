import { DataType, Operator, Output, Parameter } from '..';
import { Expr } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { ShaderAssembly } from '../../render/ShaderAssembly';

class Image extends Operator {
  public readonly outputs: Output[] = [{
    id: 'out',
    name: 'Out',
    type: DataType.RGBA,
  }];
  public readonly params: Parameter[] = [
    {
      id: 'image',
      name: 'Image',
      type: DataType.IMAGE,
    },
  ];
  public readonly description = `A bitmapped image.`;

  constructor() {
    super('pattern', 'Image', 'pattern_image');
  }

  public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
    if (assembly.start(node)) {
      assembly.declareUniforms(this, node.id, this.params);
      assembly.finish(node);
    }

    return assembly.call(
      'texture', [
        assembly.uniform(node, 'image'),
        uv,
      ], DataType.RGBA);
  }
}

export default new Image();
