import { DataType } from '../operators';
import { GraphNode } from '../graph';
import { glType } from '../operators/DataType';

/** Defines the name and type of a callable function. */
export interface FunctionDefn {
  name: string;
  result: DataType;
  args: DataType[];
}

export type ExprKind =
  | 'assign'
  | 'call'
  | 'op'
  | 'deflocal'
  | 'reflocal'
  | 'refuniform'
  | 'refinput'
  | 'reftexcoords'
  | 'literal'
  | 'typecast'
  | 'getattr'
  | 'binop'
  | 'fork';

export type BinaryOperator = 'add' | 'sub' | 'mul' | 'div';

export interface BaseExpr {
  kind: ExprKind;
  type: DataType;
}

export interface AssignExpr extends BaseExpr {
  kind: 'assign';
  left: Expr;
  right: Expr;
}

export const assign = (left: Expr, right: Expr): AssignExpr => ({
  type: left.type,
  kind: 'assign',
  left,
  right,
});

export interface CallNode extends BaseExpr {
  kind: 'call';
  callable: FunctionDefn;
  args: Expr[];
}

export const call = (callable: FunctionDefn, ...args: Expr[]): CallNode => ({
  kind: 'call',
  args,
  type: callable.result,
  callable,
});

export interface LocalDefn extends BaseExpr {
  kind: 'deflocal';
  name: string;
  type: DataType;
  init: Expr | null;
}

export const defLocal = (
  name: string,
  type: DataType,
  init: Expr | null = null
): LocalDefn => ({
  kind: 'deflocal',
  name,
  type,
  init,
});

export interface RefLocalExpr extends BaseExpr {
  kind: 'reflocal';
  name: string;
  type: DataType;
}

export const refLocal = (name: string, type: DataType): RefLocalExpr => ({
  kind: 'reflocal',
  name,
  type,
});

export interface RefUniformExpr extends BaseExpr {
  kind: 'refuniform';
  name: string;
  type: DataType;
  node: GraphNode;
}

export const refUniform = (name: string, type: DataType, node: GraphNode): RefUniformExpr => ({
  kind: 'refuniform',
  name,
  type,
  node,
});

export interface RefInputExpr extends BaseExpr {
  kind: 'refinput';
  name: string;
  type: DataType;
  node: GraphNode;
  uv: Expr;
}

export const refInput = (
  name: string,
  type: DataType,
  node: GraphNode,
  uv: Expr
): RefInputExpr => ({
  kind: 'refinput',
  name,
  type,
  node,
  uv,
});

export interface RefTexCoordsExpr extends BaseExpr {
  kind: 'reftexcoords';
  type: DataType;
}

export const refTexCoords = (): RefTexCoordsExpr => ({
  kind: 'reftexcoords',
  type: DataType.VEC2,
});

export interface LiteralNode extends BaseExpr {
  kind: 'literal';
  value: string;
}

export const literal = (value: string, type: DataType): LiteralNode => ({
  kind: 'literal',
  value,
  type,
});

export interface TypeCastExpr extends BaseExpr {
  kind: 'typecast';
  value: Expr;
}

export const typeCast = (value: Expr, type: DataType): TypeCastExpr => ({
  kind: 'typecast',
  value,
  type,
});

export interface GetAttrExpr extends BaseExpr {
  kind: 'getattr';
  base: Expr;
  name: string;
  type: DataType;
}

export const getAttr = (base: Expr, name: string, type: DataType): GetAttrExpr => ({
  kind: 'getattr',
  base,
  name,
  type,
});

export interface BinaryOpExpr extends BaseExpr {
  kind: 'binop';
  op: BinaryOperator;
  left: Expr;
  right: Expr;
  type: DataType;
}

export const binop = (
  op: BinaryOperator,
  left: Expr,
  right: Expr,
  type: DataType
): BinaryOpExpr => ({
  kind: 'binop',
  op,
  left,
  right,
  type,
});

export const add = (left: Expr, right: Expr, type: DataType): BinaryOpExpr => ({
  kind: 'binop',
  op: 'add',
  left,
  right,
  type,
});

export const multiply = (left: Expr, right: Expr, type: DataType): BinaryOpExpr => ({
  kind: 'binop',
  op: 'mul',
  left,
  right,
  type,
});

export const subtract = (left: Expr, right: Expr, type: DataType): BinaryOpExpr => ({
  kind: 'binop',
  op: 'sub',
  left,
  right,
  type,
});

export const divide = (left: Expr, right: Expr, type: DataType): BinaryOpExpr => ({
  kind: 'binop',
  op: 'div',
  left,
  right,
  type,
});

/** A 'fork' is a hint to the code generator that we are going to use the expression
    multiple times, and we might not want to re-evaluate it, so store it in a local
    variable if needed.
 */
export interface ForkExpr extends BaseExpr {
  kind: 'fork';
  value: Expr;
  name: string;
  key: symbol;
  type: DataType;
}

export const fork = (value: Expr, name: string): ForkExpr => ({
  kind: 'fork',
  value,
  name,
  key: Symbol(),
  type: value.type,
});

export type Expr =
  | AssignExpr
  | CallNode
  | LocalDefn
  | RefLocalExpr
  | RefUniformExpr
  | RefInputExpr
  | RefTexCoordsExpr
  | LiteralNode
  | TypeCastExpr
  | GetAttrExpr
  | BinaryOpExpr
  | ForkExpr;

export function defineFn(callable: FunctionDefn): (...args: Expr[]) => CallNode {
  return (...args: Expr[]) => ({
    kind: 'call',
    args,
    type: callable.result,
    callable,
  });
}

export function castIfNeeded(expr: Expr, type: DataType): Expr {
  if (expr.type === type || glType(expr.type) === glType(type)) {
    return expr;
  } else {
    return typeCast(expr, type);
  }
}
