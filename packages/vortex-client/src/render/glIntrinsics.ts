// Defines built-in GLSL functions
import { DataType } from '../operators';
import { defineFn } from './Expr';
import { makeFunctionType } from '../operators/FunctionDefn';

export const vec2 = defineFn({
  name: 'vec2',
  type: makeFunctionType({
    result: DataType.VEC2,
    args: [DataType.FLOAT, DataType.FLOAT],
  }),
});

export const vec3 = defineFn({
  name: 'vec3',
  type: makeFunctionType({
    result: DataType.VEC3,
    args: [DataType.FLOAT, DataType.FLOAT, DataType.FLOAT],
  }),
});

export const vec3_2_1 = defineFn({
  name: 'vec3',
  type: makeFunctionType({
    result: DataType.VEC3,
    args: [DataType.VEC2, DataType.FLOAT],
  }),
});

export const vec4 = defineFn({
  name: 'vec4',
  type: makeFunctionType({
    result: DataType.VEC4,
    args: [DataType.FLOAT, DataType.FLOAT, DataType.FLOAT, DataType.FLOAT],
  }),
});

export const vec4_3_1 = defineFn({
  name: 'vec4',
  type: makeFunctionType({
    result: DataType.VEC4,
    args: [DataType.VEC3, DataType.FLOAT],
  }),
});

export const fract = defineFn({
  name: 'fract',
  type: makeFunctionType({
    result: DataType.FLOAT,
    args: [DataType.FLOAT],
  }),
});

export const normalize_3 = defineFn({
  name: 'normalize',
  type: makeFunctionType({
    result: DataType.VEC3,
    args: [DataType.VEC3],
  }),
});

export const cross_3 = defineFn({
  name: 'cross',
  type: makeFunctionType({
    result: DataType.VEC3,
    args: [DataType.VEC3, DataType.VEC3],
  }),
});
