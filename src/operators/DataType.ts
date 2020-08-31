/** Data types for expressions. */
export enum DataType {
  INTEGER,// Integer
  FLOAT,  // float
  UV,     // vec2
  XYZ,    // vec3
  XYZW,   // For normal and displacement maps
  RGB,    // vec3 rgb
  RGBA,   // vec4 rgba
  RGBA_GRADIENT,  // Gradient array
  IMAGE,  // Image reference
  OTHER,  // Placeholder, not used as operator output

  // TODO: Don't use types for this.
  GROUP,  // Sentinel value that indicates a parameter group
}
