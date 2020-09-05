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
  left: ExprNode;
  right: ExprNode;
}

export const assign = (left: ExprNode, right: ExprNode): AssignExpr => ({
  type: left.type,
  kind: 'assign',
  left,
  right,
});

export interface CallNode extends BaseExpr {
  kind: 'call';
  callable: FunctionDefn;
  args: ExprNode[];
}

export const call = (callable: FunctionDefn, ...args: ExprNode[]): CallNode => ({
  kind: 'call',
  args,
  type: callable.result,
  callable,
});

export interface LocalDefn extends BaseExpr {
  kind: 'deflocal';
  name: string;
  type: DataType;
  init: ExprNode | null;
}

export const defLocal = (
  name: string,
  type: DataType,
  init: ExprNode | null = null
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
  uv: ExprNode;
}

export const refInput = (
  name: string,
  type: DataType,
  node: GraphNode,
  uv: ExprNode
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
  value: ExprNode;
}

export const typeCast = (value: ExprNode, type: DataType): TypeCastExpr => ({
  kind: 'typecast',
  value,
  type,
});

export interface GetAttrExpr extends BaseExpr {
  kind: 'getattr';
  base: ExprNode;
  name: string;
  type: DataType;
}

export const getAttr = (base: ExprNode, name: string, type: DataType): GetAttrExpr => ({
  kind: 'getattr',
  base,
  name,
  type,
});

export interface BinaryOpExpr extends BaseExpr {
  kind: 'binop';
  op: BinaryOperator;
  left: ExprNode;
  right: ExprNode;
  type: DataType;
}

export const binop = (
  op: BinaryOperator,
  left: ExprNode,
  right: ExprNode,
  type: DataType
): BinaryOpExpr => ({
  kind: 'binop',
  op,
  left,
  right,
  type,
});

export const add = (left: ExprNode, right: ExprNode, type: DataType): BinaryOpExpr => ({
  kind: 'binop',
  op: 'add',
  left,
  right,
  type,
});

export const multiply = (left: ExprNode, right: ExprNode, type: DataType): BinaryOpExpr => ({
  kind: 'binop',
  op: 'mul',
  left,
  right,
  type,
});

export const subtract = (left: ExprNode, right: ExprNode, type: DataType): BinaryOpExpr => ({
  kind: 'binop',
  op: 'sub',
  left,
  right,
  type,
});

export const divide = (left: ExprNode, right: ExprNode, type: DataType): BinaryOpExpr => ({
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
  value: ExprNode;
  name: string;
  key: symbol;
  type: DataType;
}

export const fork = (value: ExprNode, name: string): ForkExpr => ({
  kind: 'fork',
  value,
  name,
  key: Symbol(),
  type: value.type,
});

export type ExprNode =
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

export function defineFn(callable: FunctionDefn): (...args: ExprNode[]) => CallNode {
  return (...args: ExprNode[]) => ({
    kind: 'call',
    args,
    type: callable.result,
    callable,
  });
}

export function castIfNeeded(expr: ExprNode, type: DataType): ExprNode {
  if (expr.type === type || glType(expr.type) === glType(type)) {
    return expr;
  } else {
    return typeCast(expr, type);
  }
}
