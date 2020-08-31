import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { ShaderAssembly } from '../../render/ShaderAssembly';

class Illuminate extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'in',
      name: 'In',
      type: DataType.RGBA,
    },
    {
      id: 'normal',
      name: 'Normal',
      type: DataType.XYZW,
    },
  ];
  public readonly outputs: Output[] = [{
    id: 'out',
    name: 'Out',
    type: DataType.RGBA,
  }];

  public readonly params: Parameter[] = [
    {
      id: 'azimuth',
      name: 'Azimuth',
      type: DataType.FLOAT,
      min: 0,
      max: 360,
      precision: 0,
      increment: 1,
      default: 45,
    },
    {
      id: 'elevation',
      name: 'Elevation',
      type: DataType.FLOAT,
      min: 0,
      max: 90,
      precision: 0,
      increment: 1,
      default: 45,
    },
    {
      id: 'shininess',
      name: 'Shininess',
      type: DataType.FLOAT,
      min: 0,
      max: 100,
      precision: 0,
      increment: 1,
      default: 10,
    },
    {
      id: 'ambient',
      name: 'Ambient Color',
      type: DataType.RGBA,
      noAlpha: true,
      default: [0.0, 0.0, 0.0, 1.0],
    },
    {
      id: 'diffuse',
      name: 'Diffuse Color',
      type: DataType.RGBA,
      noAlpha: true,
      default: [0.5, 0.5, 0.5, 1.0],
    },
    {
      id: 'specular',
      name: 'Specular Color',
      type: DataType.RGBA,
      noAlpha: true,
      default: [0.5, 0.5, 0.5, 1.0],
    },
  ];

  public readonly description = `
Illuminate the input texture.
* **Azimuth** and **Elevation** control the direction of the light source.
* **Shininess** controls the falloff for the specular highlight.
* **Ambient Color** lights all surfaces regardless of their orientation.
* **Diffuse Color** only lights surfaces oriented towards the light source.
* **Specular Color** affects the color of the specular highlight.
`;

  constructor() {
    super('filter', 'Illuminate', 'filter_illuminate');
  }

  public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
    if (assembly.start(node)) {
      assembly.declareUniforms(this, node.id, this.params);
      assembly.addCommon('illuminate');
      assembly.finish(node);
    }

    const input = assembly.readInputValue(node, 'in', uv);
    const normal = assembly.readInputValue(node, 'normal', uv);

    const args = [
      input,
      normal,
      ...this.params.map(param => assembly.uniform(node, param.id)),
    ];

    return assembly.call('illuminate', args, DataType.RGBA);
  }
}

export default new Illuminate();
