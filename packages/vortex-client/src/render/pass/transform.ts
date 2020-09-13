import { DataType } from '../../operators';
import {
  Expr,
  castIfNeeded,
  defLocal,
  literal,
  refLocal,
  defaultValue,
} from './../Expr';

let textureCoords: Expr = literal('vTextureCoord', DataType.VEC2);

export function transform(expr: Expr, out: Expr[]): void {
  let tmpVarIndex = 1;
  const tmpVarMap = new Map<Symbol, Expr>();

  const visit = (expr: Expr): Expr => {
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
        const args = expr.args.map(arg => {
          if (typeof arg === 'number' || typeof arg === 'string') {
            return arg;
          }
          return visit(arg);
        });
        if (expr.type !== DataType.OTHER && args.every((arg, index) => arg === expr.args[index])) {
          return expr;
        }
        return { ...expr, args, type: expr.callable.type[0].result };
      }

      case 'reflocal':
      case 'refuniform':
      case 'typecast':
      case 'literal':
        return expr;

      case 'reftexcoords': {
        if (textureCoords.kind === 'reftexcoords') {
          throw Error('Bad texture coords');
        }
        return visit(textureCoords);
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
          return defaultValue(type);
        }

        const outputTerminal = inputTerminal.connection.source;
        const outputNode = outputTerminal.node;
        // const outputDefn = outputNode.operator.getOutput(outputTerminal.id);

        const result = outputNode.outputCode;
        const saveTextureCoords = textureCoords;
        textureCoords = visit(expr.uv);
        const retVal = castIfNeeded(visit(result), type);
        textureCoords = saveTextureCoords;
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

function isSimpleExpr(expr: Expr): boolean {
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
