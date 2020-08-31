import { Operator } from './Operator';
import { createContext } from 'react';

/** Maintains the list of operators. */
export class Registry {
  private operators = new Map<string, Operator>();

  constructor() {
    const catalog = require.context('./library', false, /[A-Za-z0-9_]\.ts$/);
    catalog.keys().forEach(k => {
      if (k.endsWith('.ts') && k.startsWith('./')) {
        const op = (catalog(k) as any).default as Operator;
        this.operators.set(op.id, op);
      }
    });
  }

  public has(name: string) {
    return this.operators.has(name);
  }

  public get(name: string): Operator {
    const result = this.operators.get(name);
    if (!result) {
      throw Error(`Operator not found: ${name}.`);
    }
    return result;
  }

  public get list(): Operator[] {
    return Array.from(this.operators.values());
  }
}

export const registry = new Registry();

export const RegistryContext = createContext<Registry>(registry);
