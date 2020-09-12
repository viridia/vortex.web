import { DataType, Input, Operator, Output, Parameter } from '..';
import {
  Expr,
  defineFn,
  fork,
  refInput,
  refTexCoords,
  refUniform,
} from '../../render/Expr';
import { GraphNode } from '../../graph';

const IMPORTS = new Set(['illuminate']);

export const illuminate = defineFn({
  name: 'illuminate',
  result: DataType.VEC4,
  args: [
    DataType.VEC4,
    DataType.VEC4,
    DataType.FLOAT,
    DataType.FLOAT,
    DataType.FLOAT,
    DataType.VEC4,
    DataType.VEC4,
    DataType.VEC4,
  ],
});

class Illuminate extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'in',
      name: 'In',
      type: DataType.VEC4,
    },
    {
      id: 'normal',
      name: 'Normal',
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
      type: DataType.VEC4,
      editor: 'color',
      noAlpha: true,
      default: [0.0, 0.0, 0.0, 1.0],
    },
    {
      id: 'diffuse',
      name: 'Diffuse Color',
      type: DataType.VEC4,
      editor: 'color',
      noAlpha: true,
      default: [0.5, 0.5, 0.5, 1.0],
    },
    {
      id: 'specular',
      name: 'Specular Color',
      type: DataType.VEC4,
      editor: 'color',
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

  public getImports(node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    const tuv = fork(refTexCoords(), 'uv');
    return illuminate(
      refInput('in', DataType.VEC4, node, tuv),
      refInput('normal', DataType.VEC4, node, tuv),
      ...this.params.map(param => refUniform(param.id, param.type, node))
    );
  }
}

export default new Illuminate();
