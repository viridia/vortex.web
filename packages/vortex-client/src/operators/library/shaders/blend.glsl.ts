import glsl from '../glsl';

export default glsl`
float blend_overlay(float a, float b) {
  return a < .5 ? (2. * a * b) : (1. - 2. * (1. - a) * (1. - b));
}

vec4 blend(
    vec4 a,
    vec4 b,
    int op,
    float strength,
    int norm) {
  vec3 value;
  vec3 ca = a.rgb;
  vec3 cb = b.rgb;
  const vec3 ONE = vec3(1.0, 1.0, 1.0);
  const vec3 ZERO = vec3(0.0, 0.0, 0.0);
  const vec3 SMALL = vec3(1.0/256.0, 1.0/256.0, 1.0/256.0);
  if (op == 0) { // Replace
    value = cb;
  } else if (op == 1) { // Add
    value = ca + cb;
  } else if (op == 2) { // Subtract
    value = ca - cb;
  } else if (op == 3) { // Multiply
    value = ca * cb;
  } else if (op == 4) { // Difference
    value = abs(ca - cb);
  } else if (op == 10) { // Lighten
    value = max(ca, cb);
  } else if (op == 11) { // Darken
    value = min(ca, cb);
  } else if (op == 20) { // Screen
    value = ONE - (ONE - ca) * (ONE - cb);
  } else if (op == 21) { // Overlay
    value = vec3(
      blend_overlay(ca.r, cb.r),
      blend_overlay(ca.g, cb.g),
      blend_overlay(ca.b, cb.b));
  } else if (op == 22) { // Color Dodge
    value = (ONE - ca) / max(SMALL, ONE - cb);
  } else if (op == 23) { // Color Burn
    value = ONE - (ONE - ca) / max(SMALL, cb);
  }

  if (norm != 0) {
    value = min(max(value, ZERO), ONE);
  }

  return vec4(mix(ca, value, strength), a.a);
}
`;
