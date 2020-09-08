import { AbstractTerminal } from './AbstractTerminal';
import { Connection } from './Connection';
import { GraphNode } from './GraphNode';
import { Terminal } from './Terminal';
import { observable } from 'mobx';

export class OutputTerminal extends AbstractTerminal {
  // List of output connections
  @observable public connections: Connection[] = [];

  constructor(node: GraphNode, name: string, id: string, x: number, y: number) {
    super(node, name, id, x, y, true);
  }

  /** Delete a connection from the list of connections. */
  public disconnect(connection: Connection): boolean {
    const index = this.connections.findIndex(conn => conn.dest === connection.dest);
    if (index >= 0) {
      this.connections.splice(index, 1);
      return true;
    }
    return false;
  }
}

export function isOutputTerminal(
  terminal: Terminal | null | undefined
): terminal is OutputTerminal {
  return terminal instanceof AbstractTerminal && terminal.output;
}
