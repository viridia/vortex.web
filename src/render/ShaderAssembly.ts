import { Assignment, CallExpr, Expr, ExprKind, IdentExpr, LiteralExpr, TypeCast } from './Expr';
import { DataType, Operator, Parameter } from '../operators';
import { GraphNode } from '../graph';
import { byName } from '../operators/library/shaders';

export enum TraversalState {
  IN_PROCESS,
  FINISHED,
}

/** Represents a combined shader from several operators. */
export class ShaderAssembly {
  private traversalState = new Map<number, TraversalState>();
  private common = new Set<string>();
  private extensions = new Set<string>();
  private assignmentList: Assignment[] = [];
  // private cachedValues = new Set<string>();
  private out: string[] = [
    '#version 300 es',
    'precision mediump float;\n',
  ];
  private indentLevel: number = 0;

  public toString() {
    return this.out.join('\n');
  }

  public dump() {
    const s = this.toString();
    s.split('\n').forEach((line, i) => {
      console.debug(line);
      // console.debug(`${i + 1}: ${line}`);
    });
  }

  /** Indicate that we are beginning the compilation for a node. Use for de-duping and loop
      detection. */
  public start(node: GraphNode): boolean {
    const state = this.traversalState.get(node.id);
    if (state === undefined) {
      this.traversalState.set(node.id, TraversalState.IN_PROCESS);
      return true;
    }
    return false;
  }

  /** Indicate that we have finished compilation for a node. */
  public finish(node: GraphNode) {
    const state = this.traversalState.get(node.id);
    if (state === undefined) {
      this.traversalState.set(node.id, TraversalState.FINISHED);
    }
  }

  /** Add a GL extension directive. */
  public addExtension(src: string) {
    if (!this.extensions.has(src)) {
      this.extensions.add(src);
      this.out.splice(0, 0, `#extension ${src} : enable`);
    }
  }

  /** Add a common function to the shader source. */
  public addCommon(...chunkNames: string[]) {
    for (const name of chunkNames) {
      if (!this.common.has(name)) {
        const chunk = byName[name];
        if (!chunk) {
          throw Error(`Invalid shader fragment: ${name}`);
        }
        this.common.add(name);
        this.out.push(`// Common code for ${name}.glsl`);
        this.out.push(chunk);
      }
    }
  }

  /** Construct a call expression. */
  public call(funcName: string, args: Expr[], type: DataType): CallExpr {
    return { kind: ExprKind.CALL, funcName, args, type };
  }

  /** Construct an identifier expression. */
  public ident(name: string, type: DataType): IdentExpr {
    return { kind: ExprKind.IDENT, name, type };
  }

  /** Construct a literal expression. */
  public literal(value: string, type: DataType): LiteralExpr {
    return { kind: ExprKind.LITERAL, value, type };
  }

  /** Construct a reference to a uniform. */
  public uniform(node: GraphNode, paramName: string): IdentExpr {
    const op = node.operator;
    const param: Parameter = op.getParam(paramName);
    return { kind: ExprKind.IDENT, name: op.uniformName(node.id, param), type: param.type };
  }

  public typeCast(expr: Expr, type: DataType) {
    return { kind: ExprKind.TYPE_CAST, expr, type };
  }

  /** Add an assignment to the list of statements to execute before the final return statement. */
  public assign(name: string, type: string, value: Expr) {
    if (type !== this.glType(value.type)) {
      // Eventually we will get rid of the type parameter.
      throw Error('assignment type mismatch');
    }
    this.assignmentList.push({ name, type, value });
  }

  /** Deep comparison of two expressions. */
  public equalExpr(a: Expr, b: Expr): boolean {
    if (a.kind !== b.kind || a.type !== b.type) {
      return false;
    }

    switch (a.kind) {
      case ExprKind.CALL: {
        const aCall = a as CallExpr;
        const bCall = b as CallExpr;
        if (aCall.funcName !== bCall.funcName || aCall.args.length !== bCall.args.length) {
          return false;
        }
        for (let i = 0; i < aCall.args.length; i += 1) {
          if (!this.equalExpr(aCall.args[i], bCall.args[i])) {
            return false;
          }
        }
        return true;
      }
      case ExprKind.IDENT: {
        return (a as IdentExpr).name === (b as IdentExpr).name;
      }
      case ExprKind.LITERAL: {
        return (a as LiteralExpr).value === (b as LiteralExpr).value;
      }
      case ExprKind.TYPE_CAST: {
        return this.equalExpr((a as TypeCast).expr, (b as TypeCast).expr);
      }
    }
  }

  /** Return an expression representing the input to a terminal. This is the same as the
      value from the connected output terminal, unless the input is not connected in Which
      case the expression is zero. Also handles de-duping of expressions that are used in
      more than one place. */
  public readInputValue(node: GraphNode, signalName: string, uv: Expr): Expr {
    const operator = node.operator;
    const input = operator.getInput(signalName);
    const inputTerminal = node.findInputTerminal(signalName);
    if (!inputTerminal?.connection) {
      return this.defaultValue(input.type);
    }

    const outputTerminal = inputTerminal.connection.source;
    const outputNode = outputTerminal.node;
    const outputDefn = outputNode.operator.getOutput(outputTerminal.id);
    // const outputType = this.glType(outputDefn.type);
    let result: Expr;
    // TODO: This logic is wrong in two ways.
    // need to take into account that uv might be different - compare uv expressions.
    // number of output connections is not relevant. (Uhhh, why?)
    // if (outputTerminal.connections.length > 1) {
    //   const cachedValueId = `${outputNode.operator.localPrefix(node.id)}_${outputTerminal.id}`;
    //   if (!this.cachedValues.has(cachedValueId)) {
    //     this.cachedValues.add(cachedValueId);
    //     this.assign(
    //       cachedValueId,
    //       outputType,
    //       outputNode.operator.readOutputValue(this, outputNode, outputTerminal.id, uv));
    //   }
    //   result = this.ident(cachedValueId, outputDefn.type);
    // } else {
    result = outputNode.operator.readOutputValue(this, outputNode, outputTerminal.id, uv);
    // }
    if (input.type !== outputDefn.type) {
      result = this.typeCast(result, input.type);
    }
    return result;
  }

  /** Assign shader uniform names for all of the parameters of the operator. */
  public declareUniforms(op: Operator, nodeId: number, params: Parameter[]) {
    this.out.push(`// Uniforms for ${op.id}${nodeId}`);
    for (const param of params) {
      if (param.type === DataType.GROUP) {
        this.declareUniforms(op, nodeId, param.children!);
      } else {
        this.addUniform(op, nodeId, param);
      }
    }
    this.out.push('');
  }

  /** Assign a shader uniform names for an operator parameter. */
  public addUniform(op: Operator, nodeId: number, param: Parameter) {
    const uniformName = op.uniformName(nodeId, param);
    if (param.type === DataType.RGBA_GRADIENT) {
      this.out.push(`uniform vec4 ${uniformName}_colors[32];`);
      this.out.push(`uniform float ${uniformName}_positions[32];`);
    } else {
      this.out.push(`uniform ${this.glType(param.type)} ${uniformName};`);
    }
  }

  /** Assign a shader uniform names for an operator parameter. */
  public addBufferUniform(op: Operator, nodeId: number, param: string) {
    const uniformName = op.uniformName(nodeId, param);
    this.out.push(`uniform sampler2D ${uniformName};`);
  }

  /** Generate code for the shader's main function */
  public main(expr: Expr) {
    this.out.push('in highp vec2 vTextureCoord;');
    this.out.push('out vec4 outputColor;');
    this.out.push('');
    this.out.push('void main() {');
    this.indentLevel = 2;
    this.assignmentList.forEach(assigment => {
      this.out.push(`  ${assigment.type} ${assigment.name} = ${this.emitExpr(assigment.value)};`);
    });
    this.out.push(`  outputColor = ${this.emitExpr(this.typeCast(expr, DataType.RGBA))};`);
    this.out.push('}');
  }

  public emitExpr(e: Expr): string {
    switch (e.kind) {
      case ExprKind.IDENT: {
        return (e as IdentExpr).name;
      }
      case ExprKind.LITERAL: {
        return (e as LiteralExpr).value;
      }
      case ExprKind.CALL: {
        const call = e as CallExpr;
        const result: string[] = [];
        result.push(call.funcName);
        result.push('(\n');
        this.indentLevel += 2;
        call.args.forEach((arg, i) => {
          if (i > 0) {
            result.push(',\n');
          }
          result.push(' '.repeat(this.indentLevel));
          result.push(this.emitExpr(arg));
        });
        this.indentLevel -= 2;
        result.push(')');
        return result.join('');
      }
      case ExprKind.TYPE_CAST: {
        const typeCast = e as TypeCast;
        if (typeCast.type === typeCast.expr.type) {
          return this.emitExpr(typeCast.expr);
        }
        switch (typeCast.type) {
          case DataType.FLOAT:
            if (typeCast.expr.type === DataType.XYZW || typeCast.expr.type === DataType.RGBA) {
              return `dot(${this.emitExpr(typeCast.expr)}, vec4(0.3, 0.4, 0.3, 0.0))`;
            }
            break;
          case DataType.XYZW:
          case DataType.RGBA:
            if (typeCast.expr.type === DataType.FLOAT) {
              return `vec4(vec3(1.0, 1.0, 1.0) * ` + this.emitExpr(typeCast.expr) + ', 1.0)';
            }
            if (typeCast.expr.type === DataType.XYZW || typeCast.expr.type === DataType.RGBA) {
              return this.emitExpr(typeCast.expr);
            }
            break;
          case DataType.RGB:
          case DataType.XYZ:
            if (typeCast.expr.type === DataType.FLOAT) {
              return `vec3(1.0, 1.0, 1.0)` + this.emitExpr(typeCast.expr);
            }
            break;
          default:
            break;
        }
        throw Error('Type conversion not supported: ' +
            `${DataType[typeCast.type]} ${DataType[typeCast.expr.type]}.`);
      }
    }
  }

  private defaultValue(type: DataType): LiteralExpr {
    switch (type) {
      case DataType.INTEGER:
        return this.literal('0', type);
      case DataType.FLOAT:
        return this.literal('0.0', type);
      case DataType.UV:
        return this.literal('vec2(0.0, 0.0)', type);
      case DataType.RGB:
      case DataType.XYZ:
        return this.literal('vec3(0.0, 0.0, 0.0)', type);
      case DataType.RGBA:
      case DataType.XYZW:
        return this.literal('vec4(0.0, 0.0, 0.0, 0.0)', type);
      default:
        throw Error('Invalid type');
    }
  }

  private glType(type: DataType) {
    switch (type) {
      case DataType.INTEGER:
        return 'int';
      case DataType.FLOAT:
        return 'float';
      case DataType.UV:
        return 'vec2';
      case DataType.RGB:
      case DataType.XYZ:
        return 'vec3';
      case DataType.RGBA:
      case DataType.XYZW:
        return 'vec4';
      case DataType.IMAGE:
        return 'sampler2D';
    }
  }
}
