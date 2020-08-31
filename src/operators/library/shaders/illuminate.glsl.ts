import glsl from '../glsl';

export default glsl`
vec4 illuminate(
    vec4 src,
    vec4 normal,
    float azimuth,
    float elevation,
    float shininess,
    vec4 ambient,
    vec4 diffuse,
    vec4 specular) {
  float a = radians(azimuth);
  float e = radians(elevation);
  vec3 n = normal.xyz * 2.0 - 1.0;
  vec3 color = (src * ambient).xyz;
  vec3 lightDir = vec3(sin(a) * cos(e), cos(a) * cos(e), sin(e));
  vec3 reflect = n * 2.0 - vec3(0.0, 0.0, 0.1);
  float d = dot(n, lightDir);
  if (d > 0.0) {
    color += src.xyz * diffuse.xyz * d;
  }
  float r = dot(n, lightDir);
  if (r > 0.0) {
    color += specular.xyz * pow(r, shininess);
  }
  return vec4(color, src.a);
}
`;
