import glsl from '../glsl';

export default glsl`
vec4 modulus(
    float inputVal,
    int frequency,
    float offset,
    float phase,
    vec4 color_colors[32],
    float color_positions[32]) {
  float period = 1.0 / float(frequency);
  float v = inputVal + offset * period;
  v = fract(v / period);
  if (v > phase) {
    v = 1. - (v - phase) / (1. - phase);
  } else {
    v *= 1.0 / phase;
  }
  v = smoothstep(0., 1., v);
  return gradientColor(v, color_colors, color_positions);
}
`;
