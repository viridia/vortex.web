import { DataType, Operator, Output, Parameter } from '..';
import { Expr } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { ShaderAssembly } from '../../render/ShaderAssembly';

class Cellular extends Operator {
  public readonly outputs: Output[] = [
    {
      id: 'out',
      name: 'Out',
      type: DataType.RGBA,
    },
  ];

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
      max: 10,
      precision: 2,
      increment: 0.05,
      default: 0,
    },
    {
      id: 'jitter',
      name: 'Jitter',
      type: DataType.FLOAT,
      min: 0,
      max: 1,
      precision: 2,
      increment: 0.01,
      default: 1,
    },
    {
      id: 'scale_value',
      name: 'Value Scale',
      type: DataType.FLOAT,
      min: 0.01,
      max: 2,
      default: 1,
      precision: 2,
    },
    {
      id: 'func',
      name: 'Function',
      type: DataType.INTEGER,
      enumVals: [
        { name: 'F1', value: 0 },
        { name: 'F2', value: 1 },
        { name: 'F2 - F1', value: 2 },
      ],
      default: 0,
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
Generates a periodic Worley noise texture.
* **Scale X** is the number of cells along the x-axis.
* **Scale Y** is the number of cells along the y-axis.
* **Offset Z** is the z-coordinate in the 3D noise space.
* **Jitter** controls the amount of randomness in determining cell center positions.
* **Value Scale** is a multiplier on the output.
* **Function** controls how the color is computed using the distance to the cell center point:
  * **F1** is the distance to the nearest cell center point.
  * **F2** is the distance to the *second* nearest cell center point.
  * **F2 - F1** is the difference between those two distances.
`;

  constructor() {
    super('generator', 'Cellular', 'generator_cellular');
  }

  public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
    if (assembly.start(node)) {
      assembly.declareUniforms(this, node.id, this.params);
      assembly.addCommon('permute', 'pworley', 'gradient-color', 'cellular');
      assembly.finish(node);
    }

    const colorName = this.uniformName(node.id, 'color');
    const args = [
      uv,
      assembly.uniform(node, 'scale_x'),
      assembly.uniform(node, 'scale_y'),
      assembly.uniform(node, 'offset_z'),
      assembly.uniform(node, 'jitter'),
      assembly.uniform(node, 'scale_value'),
      assembly.uniform(node, 'func'),
      assembly.ident(`${colorName}_colors`, DataType.OTHER),
      assembly.ident(`${colorName}_positions`, DataType.OTHER),
    ];
    return assembly.call('cellularNoise', args, DataType.RGBA);
  }
}

export default new Cellular();
