import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { ShaderAssembly } from '../../render/ShaderAssembly';

class Mask extends Operator {
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
    {
      id: 'mask',
      name: 'Mask',
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
      id: 'invert',
      name: 'Invert',
      type: DataType.INTEGER,
      enumVals: [
        { name: 'Off', value: 0 },
        { name: 'On', value: 1 },
      ],
      default: 0,
    },
  ];
  public readonly description = `
Blends two source images based on a grayscale mask.
`;

  constructor() {
    super('filter', 'Mask', 'filter_mask');
  }

  public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
    if (assembly.start(node)) {
      assembly.declareUniforms(this, node.id, this.params);
      assembly.addCommon('mask');
      assembly.finish(node);
    }

    const inputA = assembly.readInputValue(node, 'a', uv);
    const inputB = assembly.readInputValue(node, 'b', uv);
    const mask = assembly.readInputValue(node, 'mask', uv);
    const invert = assembly.uniform(node, 'invert');
    return assembly.call('mask', [inputA, inputB, mask, invert], DataType.RGBA);
  }
}

export default new Mask();
