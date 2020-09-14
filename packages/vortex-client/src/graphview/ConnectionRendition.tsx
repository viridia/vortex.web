import React, { FC, useMemo } from 'react';
import classNames from 'classnames';
import styled from '@emotion/styled';
import { Connection, Terminal } from '../graph';
import { colors } from '../styles';
import { darken, desaturate, transparentize } from 'polished';
import { observer } from 'mobx-react';
import { DataType } from '../operators';

const Connector = styled.path`
  stroke-width: 5px;
  stroke: ${colors.connectorStroke};
  fill: transparent;
  cursor: move;
  .pending & {
    stroke: ${darken(0.1, desaturate(0.5, colors.connectorStroke))};
  }

  g.vector-type > & {
    stroke: ${colors.connectorStrokeVector};
    stroke-width: 6px;
  }
`;

const ConnectorShadow = styled.path`
  stroke-width: 8px;
  stroke: ${transparentize(0.8, colors.connectorShadowStroke)};
  fill: transparent;

  g.vector-type > & {
    stroke-width: 9px;
  }
`;

const ConnectorOutline = styled.path`
  stroke-width: 8px;
  stroke: ${colors.connectorOutlineStroke};
  fill: transparent;

  g.vector-type > & {
    stroke-width: 9px;
  }
`;

interface Props {
  ts: Terminal | null;
  xs?: number;
  ys?: number;
  te: Terminal | null;
  xe?: number;
  ye?: number;
  pending?: boolean;
  onPointerDown?: (e: React.PointerEvent<SVGElement>) => void;
  onEdit?: (conn: Connection, output: boolean) => void;
}

export const ConnectionRendition: FC<Props> = observer(
  ({ ts, xs, ys, te, xe, ye, pending, onPointerDown }) => {
    const x0: number = ts ? ts.x + ts.node.x + 10 : xs || 0;
    const y0: number = ts ? ts.y + ts.node.y + 15 : ys || 0;
    const x1: number = te ? te.x + te.node.x + 10 : xe || 0;
    const y1: number = te ? te.y + te.node.y + 15 : ye || 0;
    const path: string = useMemo(() => {
      return [
        `M${x0} ${y0}`,
        `L${x0 + 5} ${y0}`,
        `C${x0 + 50} ${y0} ${x1 - 50} ${y1} ${x1 - 5} ${y1}`,
        `L${x1} ${y1}`,
      ].join(' ');
    }, [x0, x1, y0, y1]);

    // Just a way to force MobX to re-render us when a node gets deleted.
    if (ts?.node.deleted || te?.node.deleted) {
      return null;
    }

    const isVectorType = ts?.node.operator.getOutput(ts.id).type !== DataType.FLOAT;
    return (
      <g
        onPointerDown={onPointerDown}
        className={classNames({ pending }, isVectorType && 'vector-type' )}
        data-source={ts && `${ts.node.id}:${ts.id}`}
        data-sink={te && `${te.node.id}:${te.id}`}
      >
        <ConnectorShadow className="connector-shadow" d={path} transform="translate(0, 3)" />
        <ConnectorOutline className="connector-outline" d={path} />
        <Connector className="connector" d={path} />
      </g>
    );
  }
);
