import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { ShaderAssembly } from '../../render/ShaderAssembly';

class ColorAdjust extends Operator {
  public readonly inputs: Input[] = [{
    id: 'in',
    name: 'In',
    type: DataType.RGBA,
  }];
  public readonly outputs: Output[] = [{
    id: 'out',
    name: 'Out',
    type: DataType.RGBA,
  }];
  public readonly params: Parameter[] = [
    {
      id: 'contrast',
      name: 'Contrast',
      type: DataType.FLOAT,
      min: -1,
      max: 1,
      default: 0,
      precision: 2,
    },
    {
      id: 'brightness',
      name: 'Brightness',
      type: DataType.FLOAT,
      min: -1,
      max: 1,
      default: 0,
      precision: 2,
    },
    {
      id: 'hue',
      name: 'Hue',
      type: DataType.FLOAT,
      min: -1,
      max: 1,
      default: 0,
      precision: 2,
    },
    {
      id: 'saturation',
      name: 'Saturation',
      type: DataType.FLOAT,
      min: -2,
      max: 2,
      default: 0,
      precision: 1,
    },
  ];

  public readonly description = `Adjust colors.`;

  constructor() {
    super('filter', 'Color Adjust', 'filter_color_adjust');
  }

  public readOutputValue(assembly: ShaderAssembly, node: GraphNode, out: string, uv: Expr): Expr {
    if (assembly.start(node)) {
      assembly.declareUniforms(this, node.id, this.params);
      assembly.addCommon('hsv', 'color-adjust');
      assembly.finish(node);
    }

    const inputA = assembly.readInputValue(node, 'in', uv);
    const args = [
      inputA,
      ...this.params.map(param => assembly.uniform(node, param.id)),
    ];
    return assembly.call('colorAdjust', args, DataType.RGBA);
  }
}

export default new ColorAdjust();
