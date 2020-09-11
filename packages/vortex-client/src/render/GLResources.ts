import { ObservableMap } from "mobx";

/** Object that tracks the allocated GL resources (shaders, buffers, etc.) that are alloccated
    by a node.
*/
export class GLResources {
  public program: WebGLProgram | null = null;
  public fragment: WebGLShader | null = null;
  public textures = new ObservableMap<string, WebGLTexture>();

  private textureIndex: number = 0;

  public resetTextureIndex() {
    this.textureIndex = 0;
  }

  public nextTextureIndex(): number {
    const result = this.textureIndex;
    this.textureIndex += 1;
    return result;
  }
}
