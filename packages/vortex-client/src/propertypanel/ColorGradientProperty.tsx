import React, { FC, useCallback, useEffect } from 'react';
import { ColorGradientEditor } from '../controls/ColorGradientEditor';
import { Graph, GraphNode } from '../graph';
import { Parameter } from '../operators';
import { observer } from 'mobx-react';
import { runInAction } from 'mobx';

interface Props {
  parameter: Parameter;
  graph: Graph;
  node: GraphNode;
}

export const ColorGradientProperty: FC<Props> = observer(({ parameter, graph, node }) => {
  useEffect(() => {
    if (!node.paramValues.has(parameter.id)) {
      node.paramValues.set(parameter.id, parameter.default !== undefined ? parameter.default : []);
    }
  }, [node, parameter]);

  const onChange = useCallback(() => {
    runInAction(() => {
      graph.modified = true;
    });
  }, [graph]);

  const value = node.paramValues.get(parameter.id);
  return value ? (
    <ColorGradientEditor caption={parameter.name} value={value} onChange={onChange} />
  ) : null;
});
