import { DataType, Input, Operator, Output, Parameter } from '..';
import {
  Expr,
  add,
  defineFn,
  divide,
  fork,
  getAttr,
  literal,
  multiply,
  refInput,
  refTexCoords,
  refUniform,
} from '../../render/Expr';
import { GraphNode } from '../../graph';
import { cross_3, normalize_3, vec3_2_1, vec4_3_1 } from '../../render/glIntrinsics';
import { makeFunctionType } from '../FunctionDefn';

export const dFdx = defineFn({
  name: 'dFdx',
  type: makeFunctionType({
    result: DataType.VEC3,
    args: [DataType.VEC3],
  }),
});

export const dFdy = defineFn({
  name: 'dFdy',
  type: makeFunctionType({
    result: DataType.VEC3,
    args: [DataType.VEC3],
  }),
});

class NormalMap extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'in',
      name: 'In',
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

  public getCode(node: GraphNode): Expr {
    const scale = refUniform('scale', DataType.FLOAT, node);
    const uv = fork(refTexCoords(), 'uv');
    const t = fork(refInput('in', DataType.VEC4, node, uv), 't');
    const h = fork(
      divide(
        multiply(
          add(
            add(getAttr(t, 'x', DataType.FLOAT), getAttr(t, 'y', DataType.FLOAT), DataType.FLOAT),
            getAttr(t, 'z', DataType.FLOAT),
            DataType.FLOAT
          ),
          scale,
          DataType.FLOAT
        ),
        literal('3.0', DataType.FLOAT),
        DataType.FLOAT
      ),
      'h'
    );
    const dx = dFdx(vec3_2_1(uv, h));
    const dy = dFdy(vec3_2_1(uv, h));
    const normal = normalize_3(cross_3(dx, dy));

    return vec4_3_1(
      add(
        multiply(normal, literal('vec3(0.5, 0.5, -0.5)', DataType.VEC3), DataType.VEC3),
        literal('0.5', DataType.FLOAT),
        DataType.VEC3
      ),
      literal('1.0', DataType.FLOAT)
    );
  }

  // public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
  //   const inputA = assembly.readInputValue(node, 'in', uv);
  //   const scale = this.uniformName(node.id, 'scale');
  //   const t = `${this.localPrefix(node.id)}_t`;
  //   const h = `${this.localPrefix(node.id)}_h`;
  //   const dx = `${this.localPrefix(node.id)}_dx`;
  //   const dy = `${this.localPrefix(node.id)}_dy`;
  //   const normal = `${this.localPrefix(node.id)}_normal`;
  //   assembly.assign(t, 'vec4', inputA);
  //   assembly.assign(h, 'float',
  //       assembly.literal(`(${t}.x + ${t}.y + ${t}.z) * ${scale} / 3.0`, DataType.FLOAT));
  //   assembly.assign(dx, 'vec3',
  //       assembly.literal(`dFdx(vec3(vTextureCoord, ${h}))`, DataType.VEC3));
  //   assembly.assign(dy, 'vec3',
  //       assembly.literal(`dFdy(vec3(vTextureCoord, ${h}))`, DataType.VEC3));
  //   assembly.assign(normal, 'vec3',
  //       assembly.literal(`normalize(cross(${dx}, ${dy}))`, DataType.VEC3));
  //   return assembly.literal(`vec4(${normal} * vec3(0.5, 0.5, -0.5) + 0.5, 1.0)`, DataType.VEC4);
  // }

  constructor() {
    super('filter', 'Normal Map', 'filter_normal_map');
  }
}

export default new NormalMap();
