// Defines built-in GLSL functions

import { DataType } from '../operators';
import { defineFn } from './Expr';

export const vec2 = defineFn({
  name: 'vec2',
  result: DataType.VEC2,
  args: [DataType.FLOAT, DataType.FLOAT],
});

export const vec3 = defineFn({
  name: 'vec3',
  result: DataType.VEC3,
  args: [DataType.FLOAT, DataType.FLOAT, DataType.FLOAT],
});

export const vec3_2_1 = defineFn({
  name: 'vec3',
  result: DataType.VEC3,
  args: [DataType.VEC2, DataType.FLOAT],
});

export const vec4_3_1 = defineFn({
  name: 'vec4',
  result: DataType.VEC4,
  args: [DataType.VEC3, DataType.FLOAT],
});

export const fract = defineFn({
  name: 'fract',
  result: DataType.FLOAT,
  args: [DataType.FLOAT],
});

export const normalize_3 = defineFn({
  name: 'normalize',
  result: DataType.VEC3,
  args: [DataType.VEC3],
});

export const cross_3 = defineFn({
  name: 'cross',
  result: DataType.VEC3,
  args: [DataType.VEC3, DataType.VEC3],
});
