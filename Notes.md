# TODO:

* Graph Descriptions / Markdown
* Top-level package and build scripts
* Cloud storage:
  * List recent documents
  * Garbage collection for image references. (Good idea!)
  * Make a local store option for images
  * Admin panel for user count, resource usage
* Type conversions for node outputs
  * UV not fully supported
  * See if we can remove some of the type params that are passed in
* Limit operator dragging to document size
* Drag multiple selection.
* Finish compass rose - center button should center the diagram
* Make brick edges smoother - gamma correction?
* Cached signals not working.
* Upload JSON files
* Undo / Redo
* Log scale controls - shininess is a good example
* PBR shader
* Output type conversion - clean up and make consistent.
* Enter key to close dialogs.

* https://github.com/Jam3/glsl-fast-gaussian-blur

# Operators to do:
  * Transforms:
    * Mirror
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
    * Waves

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

* Image uploading
* Optimize blend
* Better line breaking
* Need a better method for writing shader expressions than manual Expression trees.
* Show terminal data types
* Ramp operator
* Constant Float operator
* Scroll-dragging
* Rename Exprs
* Patterns:
  * Square grid
  * Tartan
