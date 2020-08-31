import React, { Component } from 'react';
import { ChangeType, Graph, GraphNode } from '../graph';
import { ComboSlider } from '../controls/ComboSlider';
import { DataType, Parameter } from '../operators';
import { action } from 'mobx';
import { observer } from 'mobx-react';

interface Props {
  parameter: Parameter;
  node: GraphNode;
  graph: Graph;
}

@observer
export class ScalarProperty extends Component<Props> {
  public render() {
    const { parameter, node } = this.props;
    const value = node.paramValues.has(parameter.id)
      ? node.paramValues.get(parameter.id)
      : parameter.default !== undefined
      ? parameter.default
      : 0;
    let actual = value;
    let min: number = parameter.min!;
    let max: number = parameter.max !== undefined ? parameter.max : min + 1;
    if (parameter.enumVals) {
      min = 0;
      max = parameter.enumVals.length - 1;
      actual = parameter.enumVals.findIndex(e => e.value === value);
    }
    const precision =
      parameter.type === DataType.INTEGER
        ? 0
        : parameter.precision !== undefined
        ? parameter.precision
        : 2;
    const increment =
      parameter.increment !== undefined
        ? parameter.increment
        : parameter.type === DataType.INTEGER
        ? 1
        : 10 ** -precision;
    return (
      <ComboSlider
        name={parameter.name}
        value={actual}
        max={max}
        min={min}
        increment={increment}
        precision={precision}
        logScale={parameter.logScale}
        enumVals={parameter.enumVals && parameter.enumVals.map(ev => ev.name)}
        onChange={this.onChange}
      />
    );
  }

  @action.bound
  private onChange(value: number) {
    const { parameter, node, graph } = this.props;
    if (parameter.enumVals) {
      node.paramValues.set(parameter.id, parameter.enumVals[value].value);
    } else {
      node.paramValues.set(parameter.id, value);
    }
    node.notifyChange(ChangeType.PARAM_VALUE_CHANGED);
    graph.modified = true;
  }
}
