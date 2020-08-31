import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import styled from '@emotion/styled';
import { DragMethods, usePointerDrag } from '../hooks/usePointerDrag';
import { Graph, GraphNode, quantize } from '../graph';
import { RenderedImage } from '../render/RenderedImage';
import { TerminalRendition } from './TerminalRendition';
import { colors } from '../styles';
import { lighten } from 'polished';
import { observer } from 'mobx-react';
import { runInAction } from 'mobx';

const NodeElt = styled.div`
  font-size: 13px;
  position: absolute;
  cursor: pointer;
`;

const NodeBody = styled.div`
  position: relative;
  background: linear-gradient(to bottom, #fff 0%, #ccc 3%, #aaa 100%);
  width: 100px;
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

interface Props {
  node: GraphNode;
  graph: Graph;
  onScroll: (dx: number, dy: number) => void;
}

/** A visual representation of a node in the graph. */
export const NodeRendition: FC<Props> = observer(({ node, graph, onScroll }) => {
  const [base, setBase] = useState<HTMLDivElement | null>(null);
  const [dragXOffset, setDragXOffset] = useState(0);
  const [dragYOffset, setDragYOffset] = useState(0);
  const [hScroll, setHScroll] = useState(0);
  const [vScroll, setVScroll] = useState(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const dragCallbacks = useMemo<DragMethods<HTMLElement>>(
    () => ({
      onDragStart(ds, e) {
        runInAction(() => {
          if (e.ctrlKey || e.metaKey) {
            node.selected = !node.selected;
          } else if (!node.selected) {
            if (!e.shiftKey) {
              graph.clearSelection();
            }
            node.selected = true;
          }
        });

        if (node.selected && base) {
          const scrollEl = base.parentNode as HTMLElement;
          setDragXOffset(e.clientX - node.x - scrollEl.offsetLeft);
          setDragYOffset(e.clientY - node.y - scrollEl.offsetTop);
          return true;
        }

        // Cancel drag
        return false;
      },

      onDragMove(ds, e) {
        if (base) {
          const scrollEl = base.parentNode as HTMLElement;
          const graphEl = scrollEl.parentNode as HTMLElement;
          runInAction(() => {
            node.x = quantize(
              Math.min(
                graphEl.offsetLeft + graphEl.offsetWidth,
                Math.max(graphEl.offsetLeft, e.clientX)
              ) -
                dragXOffset -
                scrollEl.offsetLeft
            );
            node.y = quantize(
              Math.min(
                graphEl.offsetTop + graphEl.offsetHeight,
                Math.max(graphEl.offsetTop, e.clientY)
              ) -
                dragYOffset -
                scrollEl.offsetTop
            );
            graph.modified = true;
          });

          let hScroll = 0;
          if (e.clientX < graphEl.offsetLeft) {
            hScroll = -1;
          } else if (e.clientX > graphEl.offsetLeft + graphEl.offsetWidth) {
            hScroll = 1;
          }
          setHScroll(hScroll);

          let vScroll = 0;
          if (e.clientY < graphEl.offsetTop) {
            vScroll = -1;
          } else if (e.clientY > graphEl.offsetTop + graphEl.offsetHeight) {
            vScroll = 1;
          }
          setVScroll(vScroll);
        }
      },

      onDragEnd() {
        setHScroll(0);
        setVScroll(0);
      },
    }),
    [dragXOffset, dragYOffset, graph, node, base]
  );

  usePointerDrag(dragCallbacks, base);

  useEffect(() => {
    if (hScroll !== 0 || vScroll !== 0) {
      const timer = window.setInterval(() => {
        onScroll(-hScroll * 10, -vScroll * 10);
      }, 16);

      return () => window.clearInterval(timer);
    }
  }, [onScroll, hScroll, vScroll]);

  const style = {
    left: `${node.x}px`,
    top: `${node.y}px`,
  };

  return (
    <NodeElt
      ref={setBase}
      className={classNames('node', { selected: node.selected })}
      style={style}
    >
      <NodeBody className="body" onMouseDown={onMouseDown}>
        <NodeHeader>{node.name}</NodeHeader>
        <NodePreview className="preview">
          <RenderedImage width={80} height={80} node={node} />
        </NodePreview>
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
