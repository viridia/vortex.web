import { DataType, Operator, Output, Parameter } from '..';
import { GraphNode } from '../../graph';

const IMPORTS = new Set(['steppers', 'permute', 'pnoise', 'gradient-color', 'periodic-noise']);

class Noise extends Operator {
  public readonly deprecated = true;
  public readonly outputs: Output[] = [{
    id: 'out',
    name: 'Out',
    type: DataType.VEC4,
  }];

  public readonly params: Parameter[] = [
    {
      id: 'scale_x',
      name: 'Scale X',
      type: DataType.INTEGER,
      min: 1,
      max: 100,
      default: 1,
    },
    {
      id: 'scale_y',
      name: 'Scale Y',
      type: DataType.INTEGER,
      min: 1,
      max: 100,
      default: 1,
    },
    {
      id: 'offset_z',
      name: 'Z Offset',
      type: DataType.FLOAT,
      min: 0,
      max: 200,
      precision: 1,
      increment: 0.1,
      default: 0,
    },
    {
      id: 'scale_value',
      name: 'Value Scale',
      type: DataType.FLOAT,
      min: .01,
      max: 2,
      default: 0.7,
      precision: 2,
    },
    {
      id: 'start_band',
      name: 'Start Band',
      type: DataType.INTEGER,
      min: 1,
      max: 12,
      default: 1,
    },
    {
      id: 'end_band',
      name: 'End Band',
      type: DataType.INTEGER,
      min: 1,
      max: 12,
      default: 8,
    },
    {
      id: 'persistence',
      name: 'Persistence',
      type: DataType.FLOAT,
      min: 0,
      max: 1,
      default: 0.5,
      precision: 2,
    },
    {
      id: 'color',
      name: 'Color',
      type: DataType.RGBA_GRADIENT,
      max: 32,
      default: [
        {
          value: [0, 0, 0, 1],
          position: 0,
        },
        {
          value: [1, 1, 1, 1],
          position: 1,
        },
      ],
    },
  ];
  public readonly description = `
Generates a periodic Perlin noise texture.
* **Scale X** is the overall scaling factor along the x-axis.
* **Scale Y** is the overall scaling factor along the y-axis.
* **Z Offset** is the z-coordinate within the 3D noise space.
* **Value Scale** is a multiplier on the output.
* **Start Band** and **End Band** control the range of frequency bands. Each band represents
  one octave of noise.
* **Persistance** determines the amplitude falloff from one frequencey band to the next.

This generator is deprecated and will eventually be removed in favor of the simpler and
more efficient Noise2.
`;

  constructor() {
    super('generator', 'Noise (old)', 'pattern_noise');
  }

  public getImports(node: GraphNode): Set<string> {
    return IMPORTS;
  }

  // public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
  //   if (assembly.start(node)) {
  //     assembly.declareUniforms(this, node.id, this.params);
  //     assembly.addCommon('steppers', 'permute', 'pnoise', 'gradient-color', 'periodic-noise');
  //     assembly.finish(node);
  //   }

  //   const colorName = this.uniformName(node.id, 'color');
  //   const args = [
  //     uv,
  //     assembly.uniform(node, 'scale_x'),
  //     assembly.uniform(node, 'scale_y'),
  //     assembly.uniform(node, 'offset_z'),
  //     assembly.uniform(node, 'scale_value'),
  //     assembly.uniform(node, 'start_band'),
  //     assembly.uniform(node, 'end_band'),
  //     assembly.uniform(node, 'persistence'),
  //     assembly.ident(`${colorName}_colors`, DataType.OTHER),
  //     assembly.ident(`${colorName}_positions`, DataType.OTHER),
  //   ];
  //   return assembly.call('periodicNoise', args, DataType.VEC4);
  // }
}

export default new Noise();
