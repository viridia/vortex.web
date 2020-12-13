# TODO:

* Drag multiple selection.
* Make type conversion less agressive
  * Get rid of 'typecast' node type.
* Allow infix operators to accept number literals.
* Top-level package and build scripts
* Graph Descriptions / Markdown
* Cloud storage:
  * More robust about accidental overwrites.
  * List recent documents
  * Garbage collection for image references. (Good idea!)
  * Make a local store option for images
    * Avoids need to upload everything to cloud.
  * Admin panel for user count, resource usage
  * A way to delete items in the load list.
* Type conversions for node outputs
  * UV not fully supported
  * See if we can remove some of the type params that are passed in
* Limit operator dragging to document size
* Make brick edges smoother - gamma correction?
* Upload JSON files
* Undo / Redo
* Log scale controls - shininess is a good example
* Perhaps allow different variations based on output type...so we don't constantly convert
  when not needed?

* https://github.com/Jam3/glsl-fast-gaussian-blur

# Operators to do:
  * Transforms:
    * Mirror
    * Rotate 90
  * Filters:
    * Combine
    * Emboss - simpler than illuminate.
    * Math
    * Bump Map
  * Generators:
    * Square grid
    * Checker
    * Function
    * Tartan
    * Turbulence

  * SVG filter types:
    * feColorMatrix
    * feComponentTransfer
    * feComposite
    * feConvolveMatrix
    * feDisplacementMap
    * feMerge
    * feMorphology
    * feOffset
    * feTurbulence

# Vortex V2 - more efficient shader code generation.

* Local image uploading
* Need a better method for writing shader expressions than manual Expression trees.
  * GLSL parser?
* Show terminal data types
* Show connection data types (float, vec2, vec3, buffered) (Partly done)
* Patterns:
  * Constant Float operator
    * Probably shouldn't have a preview window.
    * This means we need different size nodes, which is something we should probably have anyway.
  * Ramp generator
  * 1d curve
  * Square grid
  * Tartan
  * Split RGBA (multiple outputs?)
  * Combine RGBA
  * Custom shader editor!!
    * We'll need an expansion button for side panel to make it wider.

* Function Curve Editor
  * Curve type
    * Constant
    * Linear
    * Bezier
  * Control point
    * position: x-coord
    * value: y-coord
    * type: 'aligned' | 'free' |
    * (incoming, outgoing) handle:
      * dPosition
      * dValue
  * Double-click to insert control point
  * Double-click again to delete control point
  * Select control point
