import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { ShaderAssembly } from '../../render/ShaderAssembly';

class Blend extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'a',
      name: 'A',
      type: DataType.RGBA,
    },
    {
      id: 'b',
      name: 'B',
      type: DataType.RGBA,
    },
  ];
  public readonly outputs: Output[] = [
    {
      id: 'out',
      name: 'Out',
      type: DataType.RGBA,
    },
  ];
  public readonly params: Parameter[] = [
    {
      id: 'op',
      name: 'Operator',
      type: DataType.INTEGER,
      enumVals: [
        { name: 'Replace', value: 0 },
        { name: 'Add', value: 1 },
        { name: 'Subtract', value: 2 },
        { name: 'Multiply', value: 3 },
        { name: 'Difference', value: 4 },
        { name: 'Lighten', value: 10 },
        { name: 'Darken', value: 11 },
        { name: 'Screen', value: 20 },
        { name: 'Overlay', value: 21 },
        { name: 'Color Dodge', value: 22 },
        { name: 'Color Burn', value: 23 },
      ],
      default: 1,
    },
    {
      id: 'strength',
      name: 'Strength',
      type: DataType.FLOAT,
      min: 0,
      max: 1,
      default: 1,
    },
    {
      id: 'norm',
      name: 'Normalize',
      type: DataType.INTEGER,
      enumVals: [
        { name: 'Off', value: 0 },
        { name: 'On', value: 1 },
      ],
      default: 1,
    },
  ];
  public readonly description = `
Blends two source images, similar to layer operations in GIMP or PhotoShop.
* **operator** determines the formula used to blend the two images.
* **strength** affects how much of the original image shows through.
* **normalize** controls whether the result is clamped to a [0..1] range.
`;

  constructor() {
    super('filter', 'Blend', 'filter_blend');
  }

  public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
    if (assembly.start(node)) {
      assembly.declareUniforms(this, node.id, this.params);
      assembly.addCommon('blend');
      assembly.finish(node);
    }

    const inputA = assembly.readInputValue(node, 'a', uv);
    const inputB = assembly.readInputValue(node, 'b', uv);
    const op = assembly.uniform(node, 'op');
    const strength = assembly.uniform(node, 'strength');
    const norm = assembly.uniform(node, 'norm');
    return assembly.call('blend', [inputA, inputB, op, strength, norm], DataType.RGBA);
  }
}

export default new Blend();
