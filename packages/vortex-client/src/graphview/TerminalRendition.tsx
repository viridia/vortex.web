import React, { FC } from 'react';
import classNames from 'classnames';
import styled from '@emotion/styled';
import { Graph, GraphNode } from '../graph';
import { InputTerminal } from '../graph/InputTerminal';
import { OutputTerminal } from '../graph/OutputTerminal';
import { colors } from '../styles';
import { observer } from 'mobx-react';

const TerminalElt = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  width: 15px;
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
export const TerminalRendition: FC<Props> = observer(({ node, terminal }) => {
  const output = terminal.output;
  return (
    <TerminalElt
        className={classNames('terminal', { in: !output, out: output, active: terminal.hover })}
        data-id={terminal.id}
        data-node={node.id}
        data-terminal={terminal.id}
        style={{ left: `${terminal.x}px`, top: `${terminal.y}px` }}
    >
      <TerminalCaption className="caption">{terminal.name}</TerminalCaption>
      <TerminalDisc className="disc" />
    </TerminalElt>
  );
});
