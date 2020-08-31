import { AbstractTerminal } from './AbstractTerminal';
import { Connection } from './Connection';
import { Terminal } from './Terminal';
import { observable } from 'mobx';

export class InputTerminal extends AbstractTerminal {
  // Single input connections
  @observable public connection: Connection | null = null;
}

export function isInputTerminal(terminal: Terminal): terminal is InputTerminal {
  return !terminal.output;
}
