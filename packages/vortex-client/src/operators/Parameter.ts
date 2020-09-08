import { DataType } from './DataType';

export interface EnumValue {
  name: string;
  value: number;
}

export type EditorType = 'color' | null;

/** Defines an operator parameter. */
export interface Parameter {
  // Variable name of this parameter
  id: string;

  // Human-readable name of this parameter
  name: string;

  // Parameter type
  type: DataType;

  // What UI editor to use for this parameter.
  editor?: EditorType;

  // Type-specific constraints
  default?: any;
  min?: number;
  max?: number;
  increment?: number;
  precision?: number;
  logScale?: boolean;
  noAlpha?: boolean;
  enumVals?: EnumValue[]; // For enumerations
  children?: Parameter[]; // If this is a group
  // static?: boolean; // Indicates this is not a uniform, but affects shader code generation.
}
