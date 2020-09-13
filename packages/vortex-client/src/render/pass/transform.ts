import { DataType } from '../../operators';
import { Expr, castIfNeeded, defLocal, refLocal, defaultValue, ExprOrLiteral } from './../Expr';
import { FunctionSignature, FunctionDefn } from '../../operators/FunctionDefn';

let textureCoords: Expr = refLocal('vTextureCoord', DataType.VEC2);

export function transform(expr: Expr, out: Expr[]): void {
  let tmpVarIndex = 1;
  const tmpVarMap = new Map<Symbol, Expr>();

  const visit = (expr: Expr): Expr => {
    switch (expr.kind) {
      case 'assign': {
        const left = visit(expr.left);
        const right = castIfNeeded(visit(expr.right), expr.left.type);
        if (expr.left === left && expr.right === right) {
          return expr;
        } else {
          return { ...expr, left, right };
        }
      }

      case 'call': {
        const argValues = expr.args.map(arg =>
          typeof arg === 'number' || typeof arg === 'string' ? arg : visit(arg)
        );
        const fnSig = findOverload(expr.callable, argValues);
        const args = argValues.map((arg, index) => castIfNeeded(arg, fnSig.args[index]));
        return {
          kind: 'ovcall',
          callable: { name: expr.callable.name, type: fnSig },
          args,
          type: fnSig.result,
        };
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
        return textureCoords;
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
        let leftType = expr.type;
        let rightType = expr.type;

        // GLSL allows multiplying or adding a vector by a scalar.
        if (expr.op === 'mul' || expr.op === 'add') {
          if (
            expr.type === DataType.VEC2 ||
            expr.type === DataType.VEC3 ||
            expr.type === DataType.VEC4
          ) {
            if (expr.left.type === DataType.FLOAT) {
              leftType = DataType.FLOAT;
            }
            if (expr.right.type === DataType.FLOAT) {
              rightType = DataType.FLOAT;
            }
          }
        }

        const left = castIfNeeded(visit(expr.left), leftType);
        const right = castIfNeeded(visit(expr.right), rightType);
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

function findOverload(callable: FunctionDefn, args: ExprOrLiteral[]): FunctionSignature {
  for (const sig of callable.type) {
    if (sig.args.length === args.length) {
      if (args.every((arg, index) => canCast(arg, sig.args[index]))) {
        return sig;
      }
    }
  }

  console.error(args);
  throw Error(`No overload found for function: ${callable.name}`);
}

function canCast(expr: ExprOrLiteral, type: DataType): boolean {
  if (typeof expr === 'string') {
    expr = Number(expr);
  }

  if (typeof expr === 'number') {
    if (type === DataType.FLOAT) {
      return true;
    } else if (type === DataType.INTEGER) {
      return Math.fround(expr) === expr;
    } else {
      return false;
    }
  }

  if (expr.type === type) {
    return true;
  }

  return false;
}
