import React, { FC } from 'react';
import classNames from 'classnames';
import styled from '@emotion/styled';
import { Graph, GraphNode } from '../graph';
import { RenderedImage } from '../render/RenderedImage';
import { TerminalRendition } from './TerminalRendition';
import { colors } from '../styles';
import { lighten } from 'polished';
import { observer } from 'mobx-react';

const NodeElt = styled.div`
  font-size: 13px;
  position: absolute;
  cursor: pointer;
`;

const NodeBody = styled.div`
  position: relative;
  background: linear-gradient(to bottom, #fff 0%, #ccc 3%, #aaa 100%);
  border-radius: 6px;
  border: 2px solid black;
  width: 90px;
  box-shadow: 1px 3px 5px rgba(0, 0, 0, 0.5);
  z-index: 12;

  .selected & {
    box-shadow: 0 0 2px 3px rgba(0, 200, 0, 0.7);
  }
`;

const NodeHeader = styled.header`
  border-bottom: 1px solid #888;
  padding: 4px 4px 2px 4px;
`;

const NodePreview = styled.section`
  border-top: 1px solid #eee;
  height: 91px;
  > canvas {
    margin: 5px;
    background-color: ${lighten(0.2, colors.graphBg)};
  }
`;

const ErrorBadge = styled.div`
  display: flex;
  box-shadow: 1px 3px 5px rgba(0, 0, 0, 0.9);
  border: 1px solid #400;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  position: absolute;
  color: white;
  font-weight: bold;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  background-color: #f00;
  right: 8px;
  top: -11px;
`;

interface Props {
  node: GraphNode;
  graph: Graph;
}

/** A visual representation of a node in the graph. */
export const NodeRendition: FC<Props> = observer(({ node, graph }) => {
  const style = {
    left: `${node.x - graph.bounds.xMin}px`,
    top: `${node.y - graph.bounds.yMin}px`,
  };

  return (
    <NodeElt
      className={classNames('node', { selected: node.selected })}
      data-node={node.id}
      style={style}
    >
      <NodeBody className="body">
        <NodeHeader>{node.name}</NodeHeader>
        <NodePreview className="preview">
          <RenderedImage width={80} height={80} node={node} />
        </NodePreview>
        {node.error && <ErrorBadge>!</ErrorBadge>}
      </NodeBody>
      {node.inputs &&
        node.inputs.map(input => (
          <TerminalRendition
            key={`input.${node.id}.${input.id}`}
            node={node}
            graph={graph}
            terminal={input}
          />
        ))}
      {node.outputs &&
        node.outputs.map(output => (
          <TerminalRendition
            key={`output.${node.id}.${output.id}`}
            node={node}
            graph={graph}
            terminal={output}
          />
        ))}
    </NodeElt>
  );
});
