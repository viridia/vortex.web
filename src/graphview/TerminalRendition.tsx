import React, { FC, useContext, useMemo, useState } from 'react';
import classNames from 'classnames';
import styled from '@emotion/styled';
import { DragContext } from './GraphView';
import { DragType } from './DragType';
import { Graph, GraphNode } from '../graph';
import { InputTerminal, isInputTerminal } from '../graph/InputTerminal';
import { OutputTerminal, isOutputTerminal } from '../graph/OutputTerminal';
import { colors } from '../styles';
import { observer } from 'mobx-react';

const TerminalElt = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  width: 20px;
  height: 30px;
  cursor: cell;
  z-index: 12;

  &.in {
    justify-content: flex-end;
    > .disc {
      border-radius: 6px 0 0 6px;
      border-right-width: 0;
    }
    > .caption {
      right: 10px;
    }
  }

  &.out {
    justify-content: flex-start;
    > .disc {
      border-radius: 0 6px 6px 0;
      border-left-width: 0;
    }
    > .caption {
      left: 8px;
    }
  }
`;

const TerminalDisc = styled.div`
  width: 8px;
  height: 14px;
  border: 2px solid black;
  background-image: linear-gradient(0deg, #88f 0%, #335 20%, #aaa 100%);
  z-index: 5;
  box-shadow: 0 3px 3px rgba(0, 0, 0, .4);
  pointer-events: none;

  .active > & {
    background-image: linear-gradient(0deg, #8cf 0%, #385 20%, #afa 100%);
  }
`;

const TerminalCaption = styled.div`
  position: absolute;
  color: ${colors.terminalCaption};
  top: -11px;
`;

interface Props {
  graph: Graph;
  node: GraphNode;
  terminal: InputTerminal | OutputTerminal;
}


/** A visual representation of an input or output terminal in the graph. */
export const TerminalRendition: FC<Props> = observer(({ graph, node, terminal }) => {
  const [active, setActive] = useState(false);
  const dragContext = useContext(DragContext);

  const methods = useMemo(() => {
    return {
      onDragStart(e: React.DragEvent) {
        dragContext.setDragOrigin(terminal);
        e.dataTransfer.dropEffect = 'none';
        e.dataTransfer.setDragImage(new Image(), 0, 0);
        e.dataTransfer.setData(terminal.output ? DragType.OUTPUT : DragType.INPUT, JSON.stringify({
          node: node.id,
          terminal: terminal.id,
        }));
      },

      onDragEnter(e: React.DragEvent) {
        const origin = dragContext.getDragOrigin();
        if (origin && origin.node !== node) {
          if (e.dataTransfer.types.indexOf(terminal.output ? DragType.INPUT : DragType.OUTPUT) >= 0) {
            if (graph.detectCycle(origin, terminal)) {
              return;
            }
            setActive(true);
            dragContext.setDragTarget(terminal);
            e.preventDefault();
          }
        }
      },

      onDragLeave() {
        if (dragContext.getDragTarget() === terminal) {
          dragContext.setDragTarget(null);
        }
        setActive(false);
      },

      onDragEnd() {
        if (dragContext.getDragOrigin() === terminal) {
          dragContext.setDragOrigin(null);
        }
      },

      onDrop() {
        const origin = dragContext.getDragOrigin();
        const target = dragContext.getDragTarget();
        if (target && origin && origin.node !== node) {
          if (isOutputTerminal(origin) && isInputTerminal(target)) {
            dragContext.graph.connectTerminals(origin, target);
          } else if (isOutputTerminal(target) && isInputTerminal(origin)) {
            dragContext.graph.connectTerminals(target, origin);
          }
        }
        setActive(false);
        dragContext.setDragOrigin(null);
        dragContext.setDragTarget(null);
      },
    }
  }, [dragContext, graph, node, terminal]);

  const output = terminal.output;
  return (
    <TerminalElt
        className={classNames('terminal', { in: !output, out: output, active })}
        data-id={terminal.id}
        data-node={node.id}
        style={{ left: `${terminal.x}px`, top: `${terminal.y}px` }}
        draggable={true}
        onDragStart={methods.onDragStart}
        onDragEnter={methods.onDragEnter}
        onDragOver={methods.onDragEnter}
        onDragLeave={methods.onDragLeave}
        onDragEnd={methods.onDragEnd}
        onDrop={methods.onDrop}
    >
      <TerminalCaption className="caption">{terminal.name}</TerminalCaption>
      <TerminalDisc className="disc" />
    </TerminalElt>
  );
});
