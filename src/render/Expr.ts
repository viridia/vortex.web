import { DataType } from '../operators';

export enum ExprKind {
  CALL,
  LITERAL,
  IDENT,
  TYPE_CAST,
}

export interface Expr {
  kind: ExprKind;
  type: DataType;
}

export interface IdentExpr extends Expr {
  kind: ExprKind.IDENT;
  name: string;
}

export interface LiteralExpr extends Expr {
  kind: ExprKind.LITERAL;
  value: string;
}

export interface CallExpr extends Expr {
  kind: ExprKind.CALL;
  funcName: string;
  args: Expr[];
}

export interface TypeCast extends Expr {
  kind: ExprKind.TYPE_CAST;
  expr: Expr;
}

export interface Assignment {
  type: string;
  name: string;
  value: Expr;
}
