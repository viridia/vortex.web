import glsl from '../glsl';

export default glsl`
vec4 mask(
    vec4 a,
    vec4 b,
    vec4 mask,
    int invert) {
  float t = (mask.r + mask.g + mask.b) / 3.0;
  if (invert != 0) {
    t = 1.0 - t;
  }
  return mix(b, a, t * mask.a);
}
`;
