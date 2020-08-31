import { DataType, Operator, Output, Parameter } from '..';
import { Expr } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { ShaderAssembly } from '../../render/ShaderAssembly';

class Waves extends Operator {
  public readonly outputs: Output[] = [{
    id: 'out',
    name: 'Out',
    type: DataType.RGBA,
  }];

  public readonly params: Parameter[] = [
    {
      id: '0',
      name: 'Wave source 1',
      type: DataType.GROUP,
      children: [
        {
          id: 'fx0',
          name: 'X Frequency',
          type: DataType.INTEGER,
          min: -20,
          max: 20,
          default: 1,
        },
        {
          id: 'fy0',
          name: 'Y Frequency',
          type: DataType.INTEGER,
          min: -20,
          max: 20,
          default: 0,
        },
        {
          id: 'phase0',
          name: 'Phase',
          type: DataType.FLOAT,
          min: 0,
          max: 1,
          precision: 2,
          increment: 0.01,
          default: 0,
        },
      ],
    },
    {
      id: '1',
      name: 'Wave source 2',
      type: DataType.GROUP,
      children: [
        {
          id: 'fx1',
          name: 'X Frequency',
          type: DataType.INTEGER,
          min: -20,
          max: 20,
          default: 0,
        },
        {
          id: 'fy1',
          name: 'Y Frequency',
          type: DataType.INTEGER,
          min: -20,
          max: 20,
          default: 0,
        },
        {
          id: 'phase1',
          name: 'Phase',
          type: DataType.FLOAT,
          min: 0,
          max: 1,
          precision: 2,
          increment: 0.01,
          default: 0,
        },
      ],
    },
    {
      id: '0',
      name: 'Wave source 3',
      type: DataType.GROUP,
      children: [
        {
          id: 'fx2',
          name: 'X Frequency',
          type: DataType.INTEGER,
          min: -20,
          max: 20,
          default: 1,
        },
        {
          id: 'fy2',
          name: 'Y Frequency',
          type: DataType.INTEGER,
          min: -20,
          max: 20,
          default: 0,
        },
        {
          id: 'phase2',
          name: 'Phase',
          type: DataType.FLOAT,
          min: 0,
          max: 1,
          precision: 2,
          increment: 0.01,
          default: 0,
        },
      ],
    },
    {
      id: 'amplitude',
      name: 'Amplitude',
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
Sums together up to three wave generators.
`;

  constructor() {
    super('generator', 'Waves', 'generator_waves');
  }

  public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
    if (assembly.start(node)) {
      assembly.declareUniforms(this, node.id, this.params);
      assembly.addCommon('gradient-color', 'waves');
      assembly.finish(node);
    }

    const colorName = this.uniformName(node.id, 'color');
    const args = [
      uv,
      assembly.uniform(node, 'fx0'),
      assembly.uniform(node, 'fy0'),
      assembly.uniform(node, 'phase0'),
      assembly.uniform(node, 'fx1'),
      assembly.uniform(node, 'fy1'),
      assembly.uniform(node, 'phase1'),
      assembly.uniform(node, 'fx2'),
      assembly.uniform(node, 'fy2'),
      assembly.uniform(node, 'phase2'),
      assembly.uniform(node, 'amplitude'),
      assembly.ident(`${colorName}_colors`, DataType.OTHER),
      assembly.ident(`${colorName}_positions`, DataType.OTHER),
    ];
    return assembly.call('waves', args, DataType.RGBA);
  }
}

export default new Waves();
