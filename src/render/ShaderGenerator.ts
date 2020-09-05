import { CodeGen } from './CodeGen';
import { DataType } from '../operators';
import {
  ExprNode,
  LiteralNode,
  assign,
  castIfNeeded,
  defLocal,
  literal,
  refLocal,
} from './ExprNode';
import { GraphNode } from '../graph';
import { byName } from '../operators/library/shaders';

const MAX_COLS = 80;

type StringTree = string | StringTree[];

/** Observer that regenerates a shader when the inputs change. */
export class ShaderGenerator {
  private textureCoords: ExprNode = literal('vTextureCoord', DataType.VEC2);

  constructor(private node: GraphNode) {}

  public dispose() {}

  public get source(): string {
    return [...this.prelude, ...this.imports, ...this.attribs, ...this.uniforms, ...this.main].join(
      '\n'
    );
  }

  private get prelude(): string[] {
    return [
      '#version 300 es',
      'precision mediump float;',
      '',
      `// Shader for ${this.node.operator.name}`,
      '',
    ];
  }

  private get imports(): string[] {
    const result: string[] = [];
    this.node.imports.forEach(name => {
      const chunk = byName[name];
      if (!chunk) {
        throw Error(`Invalid shader fragment: ${name}`);
      }

      result.push(`// Imported from ${name}.glsl`);
      result.push(chunk);
    });

    return result;
  }

  private get attribs(): string[] {
    return ['in highp vec2 vTextureCoord;', 'out vec4 outputColor;', ''];
  }

  /** List of uniform declarations. */
  private get uniforms(): string[] {
    const result: string[][] = [];
    const visitedNodes = new Set<GraphNode>();
    this.node.visitUpstreamNodes(node => {
      if (!visitedNodes.has(node)) {
        visitedNodes.add(node);
        result.push(node.uniforms);
      }
    });
    return ([] as string[]).concat(...result, this.node.uniforms);
  }

  private get main(): string[] {
    return ['void main() {', ...this.body, '}'];
  }

  private get body(): string[] {
    // Get expressions
    // TODO: Read output terminal?
    const result = this.node.outputCode;

    // Transform expessions
    const stmts: ExprNode[] = [];
    this.transform(assign(refLocal('outputColor', DataType.VEC4), result), stmts);

    // Convert to array of strings.
    const out: string[] = [];
    const cg = new CodeGen();
    for (const stmt of stmts) {
      const tree = cg.gen(stmt);
      breakLines(out, tree, 1);
    }

    return out;
  }

  /** Transform the expression graph, substituting texture coordinates and node inputs. */
  private transform(expr: ExprNode, out: ExprNode[]): void {
    let tmpVarIndex = 1;
    const tmpVarMap = new Map<Symbol, ExprNode>();

    const visit = (expr: ExprNode): ExprNode => {
      switch (expr.kind) {
        case 'assign': {
          const left = visit(expr.left);
          const right = visit(expr.right);
          if (expr.left === left && expr.right === right) {
            return expr;
          } else {
            return { ...expr, left, right };
          }
        }

        case 'call': {
          if (expr.args.length !== expr.callable.args.length) {
            throw Error(`Argument length mismatch: ${expr.callable.name}`);
          }
          const args = expr.args.map(arg => visit(arg));
          if (args.every((arg, index) => arg === expr.args[index])) {
            return expr;
          }
          return { ...expr, args };
        }

        case 'reflocal':
        case 'refuniform':
        case 'typecast':
        case 'literal':
          return expr;

        case 'reftexcoords': {
          if (this.textureCoords.kind === 'reftexcoords') {
            throw Error('Bad texture coords');
          }
          return visit(this.textureCoords);
        }

        case 'refinput': {
          // Return an expression representing the input to a terminal. This is the same as the
          // value from the connected output terminal, unless the input is not connected in Which
          // case the expression is zero. Also handles de-duping of expressions that are used in
          // more than one place.
          const { node, type, name } = expr;
          // const operator = node.operator;
          // const input = operator.getInput(name);
          const inputTerminal = node.getInputTerminal(name);
          if (!inputTerminal.connection) {
            return DEFAULT_VALUE[type];
          }

          const outputTerminal = inputTerminal.connection.source;
          const outputNode = outputTerminal.node;
          // const outputDefn = outputNode.operator.getOutput(outputTerminal.id);

          const result = outputNode.outputCode;
          const saveTextureCoords = this.textureCoords;
          this.textureCoords = visit(expr.uv);
          const retVal = castIfNeeded(visit(result), type);
          this.textureCoords = saveTextureCoords;
          return retVal;

          // public readInputValue(node: GraphNode, signalName: string, uv: Expr): Expr {
          //   let result: Expr;
          //   // TODO: This logic is wrong in two ways.
          //   // need to take into account that uv might be different - compare uv expressions.
          //   // number of output connections is not relevant. (Uhhh, why?)
          //   // if (outputTerminal.connections.length > 1) {
          //   //   const cachedValueId = `${outputNode.operator.localPrefix(node.id)}_${outputTerminal.id}`;
          //   //   if (!this.cachedValues.has(cachedValueId)) {
          //   //     this.cachedValues.add(cachedValueId);
          //   //     this.assign(
          //   //       cachedValueId,
          //   //       outputType,
          //   //       outputNode.operator.readOutputValue(this, outputNode, outputTerminal.id, uv));
          //   //   }
          //   //   result = this.ident(cachedValueId, outputDefn.type);
          //   // } else {
          //   result = outputNode.operator.readOutputValue(this, outputNode, outputTerminal.id, uv);
          //   // }
          //   if (input.type !== outputDefn.type) {
          //     result = this.typeCast(result, input.type);
          //   }
          //   return result;
          // }
        }

        case 'getattr': {
          const base = visit(expr.base);
          if (base === expr.base) {
            return expr;
          } else {
            return { ...expr, base };
          }
        }

        case 'binop': {
          const left = visit(expr.left);
          const right = visit(expr.right);
          if (left === expr.left && right === expr.right) {
            return expr;
          } else {
            return { ...expr, left, right };
          }
        }

        case 'fork': {
          const value = visit(expr.value);
          if (isSimpleExpr(value)) {
            return value;
          }

          const tmpVar = tmpVarMap.get(expr.key);
          if (tmpVar) {
            return tmpVar;
          }

          // Generate a temporary variable.
          const tmpVarDef = defLocal(`${expr.name}${tmpVarIndex}`, value.type, value);
          const tmpVarRef = refLocal(tmpVarDef.name, value.type);
          tmpVarMap.set(expr.key, tmpVarRef);
          out.push(tmpVarDef);
          return tmpVarRef;
        }

        default:
          throw new Error(`Not implemented: ${expr.kind}`);
      }
    };
    out.push(visit(expr));
  }
}

function isSimpleExpr(expr: ExprNode): boolean {
  switch (expr.kind) {
    case 'reflocal':
    case 'refuniform':
      return true;
    case 'literal':
      return expr.value.indexOf(',') < 0;
    case 'getattr':
      return isSimpleExpr(expr.base);
    default:
      return false;
  }
}

function treeLength(input: StringTree): number {
  if (typeof input === 'string') {
    return input.length;
  } else {
    return input.reduce((acc: number, elt) => {
      return acc + treeLength(elt);
    }, 0);
  }
}

function flatten(input: StringTree): string {
  if (typeof input === 'string') {
    return input;
  } else {
    return input.map(flatten).join('');
  }
}

function breakLines(out: string[], input: StringTree, indent: number) {
  if (typeof input === 'string' || indent * 2 + treeLength(input) <= MAX_COLS) {
    // No need for break, line will fit
    out.push('  '.repeat(indent) + flatten(input).trimEnd());
  } else if (input.length > 0) {
    let wrapIndent = indent;
    input.forEach(elt => {
      breakLines(out, elt, wrapIndent);
      wrapIndent = indent + 1;
    });
  }
}

const DEFAULT_VALUE: { [key: number]: LiteralNode } = {
  [DataType.INTEGER]: literal('0', DataType.INTEGER),
  [DataType.FLOAT]: literal('0.0', DataType.FLOAT),
  [DataType.VEC2]: literal('vec2(0.0, 0.0)', DataType.VEC2),
  [DataType.VEC3]: literal('vec3(0.0, 0.0, 0.0)', DataType.VEC3),
  [DataType.VEC4]: literal('vec4(0.0, 0.0, 0.0, 0.0)', DataType.VEC4),
};
