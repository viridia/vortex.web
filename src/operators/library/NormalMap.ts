import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { ShaderAssembly } from '../../render/ShaderAssembly';

class NormalMap extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'in',
      name: 'In',
      type: DataType.RGBA,
    },
  ];
  public readonly outputs: Output[] = [{
    id: 'out',
    name: 'Out',
    type: DataType.RGBA,
  }];

  public readonly params: Parameter[] = [
    {
      id: 'scale',
      name: 'Height Scale',
      type: DataType.FLOAT,
      min: -0.5,
      max: 0.5,
      precision: 3,
      increment: 0.001,
      default: 0.2,
    },
  ];

  public readonly description = `
Treating the grayscale input as a height map, computes normals.
`;

  constructor() {
    super('filter', 'Normal Map', 'filter_normal_map');
  }

  public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
    if (assembly.start(node)) {
      assembly.declareUniforms(this, node.id, this.params);
      assembly.finish(node);
    }

    const inputA = assembly.readInputValue(node, 'in', uv);
    const scale = this.uniformName(node.id, 'scale');
    const t = `${this.localPrefix(node.id)}_t`;
    const h = `${this.localPrefix(node.id)}_h`;
    const dx = `${this.localPrefix(node.id)}_dx`;
    const dy = `${this.localPrefix(node.id)}_dy`;
    const normal = `${this.localPrefix(node.id)}_normal`;
    assembly.assign(t, 'vec4', inputA);
    assembly.assign(h, 'float',
        assembly.literal(`(${t}.x + ${t}.y + ${t}.z) * ${scale} / 3.0`, DataType.FLOAT));
    assembly.assign(dx, 'vec3',
        assembly.literal(`dFdx(vec3(vTextureCoord, ${h}))`, DataType.XYZ));
    assembly.assign(dy, 'vec3',
        assembly.literal(`dFdy(vec3(vTextureCoord, ${h}))`, DataType.XYZ));
    assembly.assign(normal, 'vec3',
        assembly.literal(`normalize(cross(${dx}, ${dy}))`, DataType.XYZ));
    return assembly.literal(`vec4(${normal} * vec3(0.5, 0.5, -0.5) + 0.5, 1.0)`, DataType.XYZW);
  }
}

export default new NormalMap();
