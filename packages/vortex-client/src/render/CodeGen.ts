import { BinaryOpExpr, BinaryOperator, Expr, castIfNeeded } from './Expr';
import { DataType } from '../operators';
import { glType } from '../operators/DataType';

/** Line-wrapping styles:

    * list - break before each list element
    * flat - prefer to break in as few places as possible.
    * right - prefer to break the right side before the left.
 */
type WrapStyle = 'list' | 'right' | 'flat';

/** A string tree is a set of nested arrays containing strings. The arrays represent
    potential points where line-wrapping can occur. So for example:

      [['A', ' = '], 'B']

    This indicates that a breakpoint after the '=' is preferable to a breakpoint before
    the '=' since it is higher up in the tree.
 */
export type StringChunk = string | { wrap: WrapStyle; fragments: StringChunk[] };

const list = (...fragments: StringChunk[]): StringChunk => ({
  wrap: 'list',
  fragments,
});

const flat = (...fragments: StringChunk[]): StringChunk => ({
  wrap: 'flat',
  fragments,
});

const right = (left: StringChunk, right: StringChunk): StringChunk => ({
  wrap: 'right',
  fragments: [left, right],
});

/** Code generator. Takes in an expression tree and outputs a string tree. */
export class CodeGen {
  public gen(expr: Expr, suffix: string = ''): StringChunk {
    switch (expr.kind) {
      case 'assign': {
        // Bind the '=' more tightly to the first segment
        return right(
          this.gen(expr.left, ' = '),
          this.gen(castIfNeeded(expr.right, expr.left.type), ';')
        );
      }

      case 'call': {
        if (expr.args.length !== expr.callable.args.length) {
          throw Error(`Argument length mismatch: ${expr.callable.name}`);
        }
        return list(
          expr.callable.name + (expr.args.length > 0 ? '(' : '()' + suffix),
          ...expr.args.map((arg, index) => {
            const argVal = castIfNeeded(arg, expr.callable.args[index]);
            if (index < expr.args.length - 1) {
              return this.gen(argVal, ', ');
            } else {
              return this.gen(argVal, ')' + suffix);
            }
          })
        );
      }

      case 'deflocal': {
        if (expr.init) {
          // Bind the '=' more tightly to the first segment
          return right(
            flat(glType(expr.type) + ' ', expr.name, ' = '),
            this.gen(castIfNeeded(expr.init, expr.type), ';')
          );
        } else {
          return flat(glType(expr.type) + ' ', expr.name, ';');
        }
      }

      case 'reflocal': {
        return expr.name + suffix;
      }

      case 'refuniform': {
        return expr.node.operator.uniformName(expr.node.id, expr.name) + suffix;
      }

      case 'typecast': {
        const srcType = expr.value.type;
        const dstType = expr.type;
        if (srcType === dstType) {
          return this.gen(expr.value, suffix);
        }

        switch (dstType) {
          case DataType.FLOAT:
            if (srcType === DataType.VEC4) {
              return flat('dot(', this.gen(expr.value), ', vec4(0.3, 0.4, 0.3, 0.0))' + suffix);
            } else if (srcType === DataType.VEC3) {
              return flat('dot(', this.gen(expr.value), ', vec3(0.3, 0.4, 0.3))' + suffix);
            } else if (srcType === DataType.INTEGER) {
              return flat('float(', this.gen(expr.value), ')' + suffix);
            }
            break;
          case DataType.VEC4:
            if (srcType === DataType.FLOAT) {
              return flat(
                'vec4(vec3(1.0, 1.0, 1.0) * ',
                this.gen(expr.value, ', '),
                '1.0)' + suffix
              );
            }
            break;
          case DataType.VEC3:
            if (srcType === DataType.FLOAT) {
              return flat('vec3(1.0, 1.0, 1.0) * ', this.gen(expr.value, suffix));
            }
            break;
          default:
            break;
        }
        console.error(`Bad cast ${DataType[srcType]} => ${DataType[dstType]}`);
        return flat(
          `badcast(${DataType[srcType]} ${DataType[dstType]})`,
          this.gen(expr.value, suffix)
        );
        // throw Error(
        //   `Type conversion not supported: ${DataType[expr.type]} ${DataType[expr.value.type]}.`
        // );
      }

      case 'literal': {
        return expr.value + suffix;
      }

      case 'getattr': {
        return this.gen(expr.base, `.${expr.name}${suffix}`);
      }

      case 'binop': {
        const parensIfNeeded = (expr: Expr, parent: BinaryOpExpr): StringChunk => {
          const parentPrec = precedence[parent.op];
          if (expr.kind === 'binop') {
            if (expr.op === parent.op && commutative[parent.op]) {
              return this.gen(expr);
            }
            const argPrec = precedence[expr.op];
            if (argPrec <= parentPrec) {
              return flat('(', this.gen(expr), ')');
            }
          }
          return this.gen(expr);
        };

        let leftType = expr.type;
        let rightType = expr.type;

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

        // TODO: Test that this works
        const left = parensIfNeeded(castIfNeeded(expr.left, leftType), expr);
        const right = parensIfNeeded(castIfNeeded(expr.right, rightType), expr);
        if (suffix) {
          if (suffix === ';' || suffix.startsWith(',')) {
            return flat(left, operator[expr.op], right, suffix);
          }
          return flat('(', left, operator[expr.op], right, ')', suffix);
        } else {
          return flat(left, operator[expr.op], right);
        }
      }

      default:
        console.warn(JSON.stringify(expr, null, 2));
        throw new Error(`Not implemented: ${expr.kind}`);
    }
  }
}

const operator: { [name in BinaryOperator]: string } = {
  add: ' + ',
  sub: ' - ',
  mul: ' * ',
  div: ' / ',
};

const precedence: { [name in BinaryOperator]: number } = {
  add: 1,
  sub: 1,
  mul: 2,
  div: 2,
};

const commutative: { [name in BinaryOperator]: boolean } = {
  add: true,
  sub: false,
  mul: true,
  div: false,
};
