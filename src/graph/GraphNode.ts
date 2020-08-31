import { Connection } from './Connection';
import { DataType, Operator } from '../operators';
import { GLResources } from '../render/GLResources';
import { InputTerminal } from './InputTerminal';
import { OutputTerminal } from './OutputTerminal';
import { Renderer } from '../render/Renderer';
import { Terminal } from './Terminal';
import { observable } from 'mobx';

export enum ChangeType {
  NONE,
  PARAM_VALUE_CHANGED,
  CONNECTION_CHANGED,
  NODE_DELETED,
}

type Watcher = (change: ChangeType) => void;

/** A node in the graph. */
export class GraphNode {
  // Node coordinates
  @observable public x: number = 0;
  @observable public y: number = 0;

  // Node i/o
  public inputs: InputTerminal[] = [];
  public outputs: OutputTerminal[] = [];

  // Node parameters
  @observable public paramValues: Map<string, any> = new Map();

  // Node selection state
  @observable public selected: boolean = false;

  // Preview needs recalculation
  @observable public deleted = false;

  // GL resources allocated by the operator for this node.
  public glResources: GLResources | undefined;

  // List of entities that need to be notified when any of the node properties change.
  private watchers: Set<Watcher> = new Set();
  private changeInProgress: ChangeType = ChangeType.NONE;

  constructor(
    // Defines what this node does.
    public readonly operator: Operator,
    // Unique id of this node within a graph
    public readonly id: number
  ) {
    this.operator = operator;
    if (operator.inputs) {
      const spacing = Math.min(36, 120 / operator.inputs.length);
      let y = Math.floor((120 - operator.inputs.length * spacing) / 2);
      operator.inputs.forEach(input => {
        this.inputs.push(new InputTerminal(this, input.name, input.id, -19, y));
        y += spacing;
      });
    }
    if (operator.outputs) {
      const spacing = Math.min(36, 120 / operator.outputs.length);
      let y = Math.floor((120 - operator.outputs.length * spacing) / 2);
      (operator.outputs || []).forEach(output => {
        this.outputs.push(new OutputTerminal(this, output.name, output.id, 93, y));
        y += spacing;
      });
    }
  }

  // The human-readable name of this node.
  public get name(): string {
    return this.operator.name;
  }

  public destroy(renderer: Renderer) {
    this.operator.cleanup(renderer, this);
  }

  public ensureGLResources(): GLResources {
    if (!this.glResources) {
      this.glResources = new GLResources();
    }
    return this.glResources;
  }

  public findInputTerminal(id: string): InputTerminal | undefined {
    return this.inputs.find(t => t.id === id);
  }

  public findOutputTerminal(id: string): OutputTerminal | undefined {
    return this.outputs.find(t => t.id === id);
  }

  public findTerminal(id: string): Terminal | undefined {
    return this.findInputTerminal(id) || this.findOutputTerminal(id);
  }

  /** Visit all nodes which transitively feed into this node's inputs.
      Return 'false' from the callback to signal that the visitor should not traverse any
      deeper into the graph.
      @param callback A function which is called for every upstream node. Three arguments are
        passed: the upstream node, and the connection leading to that node.
  */
  public visitUpstreamNodes(callback: (node: GraphNode, conn: Connection) => boolean | void) {
    const visited = new Set<number>();
    const visit = (node: GraphNode): void => {
      if (node.id && !visited.has(node.id)) {
        visited.add(node.id);
        for (const input of node.inputs) {
          const connection = input.connection;
          if (connection && connection.source) {
            if (callback(connection.source.node, connection) !== false) {
              visit(connection.source.node);
            }
          }
        }
      }
    };
    visit(this);
  }

  /** Visit all nodes which transitively depend on this node's outputs.
      Return 'false' from the callback to signal that the visitor should not traverse any
      deeper into the graph.
  */
  public visitDownstreamNodes(callback: (node: GraphNode, conn: Connection) => boolean | void) {
    const visited = new Set<number>();
    const visit = (node: GraphNode): void => {
      if (node.id && !visited.has(node.id)) {
        visited.add(node.id);
        for (const output of this.outputs) {
          for (const connection of output.connections) {
            if (connection.dest) {
              if (callback(connection.dest.node, connection) !== false) {
                visit(connection.source.node);
              }
            }
          }
        }
      }
    };
    visit(this);
  }

  public notifyChange(change: ChangeType) {
    if (this.changeInProgress !== change) {
      this.changeInProgress = change;
      if (change !== ChangeType.NODE_DELETED) {
        this.visitDownstreamNodes((node, termId) => {
          node.notifyChange(change);
        });
      }
      window.requestAnimationFrame(() => {
        if (this.changeInProgress !== ChangeType.NONE) {
          this.watchers.forEach(watcher => {
            watcher(this.changeInProgress);
          });
          this.changeInProgress = ChangeType.NONE;
        }
      });
    }
  }

  public setDeleted() {
    if (!this.deleted) {
      this.deleted = true;
      this.notifyChange(ChangeType.NODE_DELETED);
    }
  }

  public watch(watcher: Watcher) {
    this.watchers.add(watcher);
  }

  public unwatch(watcher: Watcher) {
    this.watchers.delete(watcher);
  }

  public toJs(): any {
    const params: any = {};
    for (const param of this.operator.paramList) {
      if (this.paramValues.has(param.id)) {
        params[param.id] = this.paramValues.get(param.id);
      } else if (param.default !== undefined) {
        params[param.id] = param.default;
      }
    }
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      operator: this.operator.id,
      params,
    };
  }

  public loadTextures(renderer: Renderer) {
    for (const param of this.operator.paramList) {
      if (param.type === DataType.IMAGE && this.paramValues.has(param.id)) {
        const imageUrl = this.paramValues.get(param.id);
        if (imageUrl) {
          renderer.loadTexture(imageUrl, texture => {
            this.ensureGLResources().textures.set(param.id, texture);
            this.notifyChange(ChangeType.PARAM_VALUE_CHANGED);
          });
        }
      }
    }
  }

  public getTexture(id: string): WebGLTexture {
    if (this.glResources) {
      const texture = this.glResources.textures.get(id);
      if (texture) {
        return texture;
      }
    }
    throw Error(`Texture not found: ${id}`);
  }
}
