import { DataType, Operator, Output, Parameter } from '..';
import { Expr } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { ShaderAssembly } from '../../render/ShaderAssembly';

class TriangleGrid extends Operator {
  public readonly outputs: Output[] = [{
    id: 'out',
    name: 'Out',
    type: DataType.FLOAT,
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
    {
      id: 'margin',
      name: 'Spacing',
      type: DataType.FLOAT,
      min: 0,
      max: .5,
      default: .025,
    },
    {
      id: 'roundness',
      name: 'Roundness',
      type: DataType.FLOAT,
      min: 1,
      max: 5,
      precision: 1,
      default: 1,
    },
    {
      id: 'blur',
      name: 'Blur',
      type: DataType.FLOAT,
      min: 0,
      max: .5,
      default: .1,
    },
    {
      id: 'offset_x',
      name: 'Offset X',
      type: DataType.FLOAT,
      min: 0,
      max: .5,
    },
    {
      id: 'offset_y',
      name: 'Offset Y',
      type: DataType.FLOAT,
      min: 0,
      max: .5,
    },
    {
      id: 'corner',
      name: 'Corner Shape',
      type: DataType.INTEGER,
      enumVals: [
        { name: 'Sharp', value: 0 },
        { name: 'Mitered', value: 1 },
        { name: 'Smooth', value: 2 },
      ],
      default: 0,
    },
  ];
  public readonly description = `
Generates a triangular grid pattern.
* **Count X** is the number of triangles along the x-axis.
* **Count Y** is the number of triangles along the y-axis.
* **Spacing** is the space between the triangles.
* **Roundness** controls the roundness / sharpness of the tiangle corners.
* **Blur** controls the softness of the triangle edges.
* **Offset X** shifts the entire pattern along the X-axis.
* **Offset Y** shifts the entire pattern along the y-axis.
* **Corner** controls the style of the corners (sharp, round or mitered).
`;

  constructor() {
    super('pattern', 'Triangle Grid', 'pattern_trianglegrid');
  }

  public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
    if (assembly.start(node)) {
      assembly.declareUniforms(this, node.id, this.params);
      assembly.addCommon('steppers', 'triangles');
      assembly.finish(node);
    }

    const args = [
      uv,
      ...this.params.map(param => assembly.uniform(node, param.id)),
    ];
    return assembly.call('triangles', args, DataType.FLOAT);
  }
}

export default new TriangleGrid();
