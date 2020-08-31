import { DataType, Operator, Output, Parameter } from '..';
import { Expr } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { ShaderAssembly } from '../../render/ShaderAssembly';

class Noise extends Operator {
  public readonly outputs: Output[] = [{
    id: 'out',
    name: 'Out',
    type: DataType.RGBA,
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
`;

  constructor() {
    super('generator', 'Perlin Noise', 'pattern_pnoise');
  }

  public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
    if (assembly.start(node)) {
      assembly.declareUniforms(this, node.id, this.params);
      assembly.addCommon('steppers', 'permute', 'pnoise', 'gradient-color', 'periodic-noise2');
      assembly.finish(node);
    }

    const args = [
      uv,
      assembly.uniform(node, 'scale_x'),
      assembly.uniform(node, 'scale_y'),
      assembly.uniform(node, 'offset_z'),
      assembly.uniform(node, 'start_band'),
      assembly.uniform(node, 'end_band'),
      assembly.uniform(node, 'persistence'),
    ];
    return assembly.call('periodicNoise2', args, DataType.FLOAT);
  }
}

export default new Noise();
