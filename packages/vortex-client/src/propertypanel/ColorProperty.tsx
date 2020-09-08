import React, { FC, useCallback, useEffect, useRef } from 'react';
import { ColorPicker } from '../controls/ColorPicker';
import { Graph, GraphNode } from '../graph';
import { Parameter } from '../operators';
import { RGBAColor } from '../render/colors';
import { observer } from 'mobx-react';
import { runInAction } from 'mobx';

interface Props {
  parameter: Parameter;
  node: GraphNode;
  graph: Graph;
}

export const ColorProperty: FC<Props> = observer(({ parameter, node, graph }) => {
  const colorPicker = useRef<ColorPicker>(null);

  const onChange = useCallback(
    (value: RGBAColor) => {
      runInAction(() => {
        node.paramValues.set(parameter.id, value);
        graph.modified = true;
      });
    },
    [graph, node, parameter]
  );

  useEffect(() => {
    const value = node.paramValues.has(parameter.id)
      ? node.paramValues.get(parameter.id)
      : parameter.default !== undefined
      ? parameter.default
      : [0, 0, 0, 1];
    colorPicker.current?.setRGBA(value);
  }, [node, parameter]);

  return (
    <section className="color-property">
      <header>{parameter.name}</header>
      <ColorPicker ref={colorPicker} onChange={onChange} alpha={!parameter.noAlpha} />
    </section>
  );
});
