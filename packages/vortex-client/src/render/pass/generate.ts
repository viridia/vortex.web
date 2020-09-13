import { BinaryOpExpr, BinaryOperator, Expr, castIfNeeded } from '../Expr';
import { DataType } from '../../operators';
import { glType } from '../../operators/DataType';
import { OutputChunk, fcall, flat, parens, stmt, infix } from '../OutputChunk';

/** Code generator. Takes in an expression tree and outputs a string tree. */
export function generate(expr: Expr): OutputChunk {
  switch (expr.kind) {
    case 'assign': {
      // Bind the '=' more tightly to the first segment
      return stmt(
        infix('=', generate(expr.left), generate(castIfNeeded(expr.right, expr.left.type)))
      );
    }

    case 'call': {
      if (expr.args.length !== expr.callable.args.length) {
        throw Error(`Argument length mismatch: ${expr.callable.name}`);
      }
      return fcall(
        expr.callable.name,
        expr.args.map((arg, index) => generate(castIfNeeded(arg, expr.callable.args[index])))
      );
    }

    case 'deflocal': {
      if (expr.init) {
        // Bind the '=' more tightly to the first segment
        return stmt(infix(
          '=',
          flat(glType(expr.type), ' ', expr.name),
          generate(castIfNeeded(expr.init, expr.type)),
        ));
      } else {
        return flat(glType(expr.type), ' ', expr.name, ';');
      }
    }

    case 'reflocal': {
      return expr.name;
    }

    case 'refuniform': {
      return expr.node.operator.uniformName(expr.node.id, expr.name);
    }

    case 'typecast': {
      const srcType = expr.value.type;
      const dstType = expr.type;
      if (srcType === dstType) {
        return generate(expr.value);
      }

      switch (dstType) {
        case DataType.FLOAT:
          if (srcType === DataType.VEC4) {
            return fcall('dot', [generate(expr.value), 'vec4(0.3, 0.4, 0.3, 0.0)']);
          } else if (srcType === DataType.VEC3) {
            return fcall('dot', [generate(expr.value), 'vec3(0.3, 0.4, 0.3)']);
          } else if (srcType === DataType.INTEGER) {
            return fcall('float', [generate(expr.value)]);
          }
          break;
        case DataType.VEC4:
          if (srcType === DataType.FLOAT) {
            return fcall('vec4', [flat('vec3(1.0, 1.0, 1.0) * ', generate(expr.value)), '1.0']);
          }
          break;
        case DataType.VEC3:
          if (srcType === DataType.FLOAT) {
            return flat('vec3(1.0, 1.0, 1.0) * ', generate(expr.value));
          }
          break;
        default:
          break;
      }
      console.error(`Bad cast ${DataType[srcType]} => ${DataType[dstType]}`);
      return flat(`badcast(${DataType[srcType]} ${DataType[dstType]})`, generate(expr.value));
      // throw Error(
      //   `Type conversion not supported: ${DataType[expr.type]} ${DataType[expr.value.type]}.`
      // );
    }

    case 'literal': {
      return expr.value;
    }

    case 'getattr': {
      return flat(generate(expr.base), '.', expr.name);
    }

    case 'binop': {
      const parensIfNeeded = (expr: Expr, parent: BinaryOpExpr): OutputChunk => {
        const parentPrec = precedence[parent.op];
        if (expr.kind === 'binop') {
          if (expr.op === parent.op && commutative[parent.op]) {
            return generate(expr);
          }
          const argPrec = precedence[expr.op];
          if (argPrec <= parentPrec) {
            return parens(generate(expr));
          }
        }
        return generate(expr);
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
      return flat(left, operator[expr.op], right);
    }

    default:
      console.warn(JSON.stringify(expr, null, 2));
      throw new Error(`Not implemented: ${expr.kind}`);
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
