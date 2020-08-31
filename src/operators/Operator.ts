import { DataType } from './DataType';
import { Expr } from '../render/Expr';
import { GraphNode } from '../graph';
import { Input } from './Input';
import { Output } from './Output';
import { Parameter } from './Parameter';
import { Renderer } from '../render/Renderer';
import { ShaderAssembly } from '../render/ShaderAssembly';

/** Defines a type of node. */
export abstract class Operator {
  public readonly group: string; // Which group, e.g. 'math', 'generator', 'filter', 'display'
  public readonly name: string; // Type name, e.g. 'noise'
  public readonly id: string; // Unique id of this operator
  public readonly inputs: Input[] = [];
  public readonly outputs: Output[] = [];
  public readonly params: Parameter[] = [];
  public abstract readonly description?: string;

  constructor(group: string, name: string, id: string) {
    this.group = group;
    this.name = name;
    this.id = id;
  }

  // Render a node with the specified renderer.
  public renderNode(renderer: Renderer, node: GraphNode): void {
    if (!node.glResources?.program) {
      renderer.compileShaderProgram(this.build(node), node);
    }

    const program: WebGLProgram = node.glResources?.program!;
    if (program) {
      renderer.executeShaderProgram(node, gl => {
        // Set the uniforms for this node and all upstream nodes.
        renderer.setShaderUniforms(node, program);
        if (this.inputs.length > 0) {
          for (const input of this.inputs) {
            if (input.buffered) {
              renderer.setShaderInputBufferUniforms(node, program, input.id);
            }
          }
          node.visitUpstreamNodes((upstream, connection) => {
            renderer.setShaderUniforms(upstream, program);
          });
        }
      });
    }
  }

  // Release any GL resources we were holding on to.
  public cleanup(renderer: Renderer, node: GraphNode): void {
    renderer.deleteShaderResources(node.glResources);
    renderer.deleteTextureResources(node.glResources);
  }

  /** Locate an operator input by id. */
  public getInput(id: string): Input {
    const result = this.inputs && this.inputs.find(i => i.id === id);
    if (!result) {
      throw Error(`Operator input not found: ${this.id}:${id}`);
    }
    return result;
  }

  /** Locate an operator output by id. */
  public getOutput(id: string): Output {
    const result = this.outputs && this.outputs.find(i => i.id === id);
    if (!result) {
      throw Error(`Operator outputs not found: ${this.id}:${id}`);
    }
    return result;
  }

  /** Locate an operator output by id. */
  public getParam(id: string): Parameter {
    for (const p of this.params) {
      if (p.id === id) {
        return p;
      } else if (p.children) {
        for (const c of p.children) {
          if (c.id === id) {
            return c;
          }
        }
      }
    }
    throw Error(`Parameter not found: ${this.id}.${id}`);
  }

  /** Return parameters as a flat list. */
  public get paramList(): Parameter[] {
    const result: Parameter[] = [];
    for (const param of this.params) {
      if (param.children) {
        result.splice(result.length, 0, ...param.children);
      } else {
        result.push(param);
      }
    }
    return result;
  }

  /** Returns an expression object representing the output of this node. */
  public abstract readOutputValue(
    assembly: ShaderAssembly,
    node: GraphNode,
    output: string,
    uv: Expr
  ): Expr;

  /** Build the shader for this operator and its current input connections.
      The shader will include the source for this operator and any operators it depends on.
      If an input is buffered, then it will not include the code to generate that input,
      but rather generate a reference to a texture sampler which contains the buffered result. */
  public build(node: GraphNode): string {
    if (this.outputs.length > 0) {
      const assembly = new ShaderAssembly();
      const uv = assembly.literal('vTextureCoord', DataType.UV);
      assembly.main(this.readOutputValue(assembly, node, this.outputs[0].id, uv));
      return assembly.toString();
    }
    throw Error('Node with no output');
  }

  public localPrefix(nodeId: number) {
    const opName = this.id.slice(0, 1).toUpperCase() + this.id.slice(1);
    return `t${opName}${nodeId}`;
  }

  public uniformPrefix(nodeId: number) {
    const opName = this.id.slice(0, 1).toUpperCase() + this.id.slice(1);
    return `u${opName}${nodeId}`;
  }

  public uniformName(nodeId: number, param: Parameter | string) {
    if (typeof param === 'string') {
      return `${this.uniformPrefix(nodeId)}_${param}`;
    }
    return `${this.uniformPrefix(nodeId)}_${param.id}`;
  }
}
