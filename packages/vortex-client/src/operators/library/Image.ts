import { DataType, Operator, Output, Parameter } from '..';
import { Expr, defineFn, literal, refTexCoords, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';

export const texture = defineFn({
  name: 'texture',
  result: DataType.VEC4,
  args: [DataType.IMAGE, DataType.VEC2],
});

class Image extends Operator {
  public readonly outputs: Output[] = [
    {
      id: 'out',
      name: 'Out',
      type: DataType.VEC4,
    },
  ];
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

  public getCode(node: GraphNode): Expr {
    if (node.paramValues.has('image')) {
      return texture(refUniform('image', DataType.IMAGE, node), refTexCoords());
    }
    return literal('vec4(0.0, 0.0, 0.0, 0.0)', DataType.VEC4);
  }

  // public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
  //   return assembly.call(
  //     'texture', [
  //       assembly.uniform(node, 'image'),
  //       uv,
  //     ], DataType.VEC4);
  // }
}

export default new Image();
