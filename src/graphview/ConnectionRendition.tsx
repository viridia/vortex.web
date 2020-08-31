import React, { FC, useCallback, useRef } from 'react';
import classNames from 'classnames';
import styled from '@emotion/styled';
import { Connection, Terminal } from '../graph';
import { colors } from '../styles';
import { darken, desaturate, transparentize } from 'polished';
import { observer } from 'mobx-react';

const Connector = styled.path`
  stroke-width: 6px;
  stroke: ${colors.connectorStroke};
  fill: transparent;
  cursor: move;
  .pending & {
    stroke: ${darken(0.1, desaturate(0.5, colors.connectorStroke))};
  }
`;

const ConnectorShadow = styled.path`
  stroke-width: 9px;
  stroke: ${transparentize(0.8, colors.connectorShadowStroke)};
  fill: transparent;
`;

const ConnectorOutline = styled.path`
  stroke-width: 9px;
  stroke: ${colors.connectorOutlineStroke};
  fill: transparent;
`;

interface Props {
  ts: Terminal | null;
  xs?: number;
  ys?: number;
  te: Terminal | null;
  xe?: number;
  ye?: number;
  pending?: boolean;
  connection?: Connection;
  onEdit?: (conn: Connection, output: boolean) => void;
}

export const ConnectionRendition: FC<Props> = observer(({
  ts,
  xs,
  ys,
  te,
  xe,
  ye,
  pending,
  connection,
  onEdit,
}) => {
  const base = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (ts && te && connection && onEdit && base.current) {
      const svgDoc = base.current.parentNode as SVGSVGElement;
      const clientRect = svgDoc.getBoundingClientRect();
      const x = e.clientX - clientRect.left + svgDoc.viewBox.baseVal.x;
      const y = e.clientX - clientRect.top + svgDoc.viewBox.baseVal.y;
      const de = (x - te.x - te.node.x - 10) ** 2 + (y - te.y - te.node.y - 10) ** 2;
      const ds = (x - ts.x - ts.node.x - 15) ** 2 + (y - ts.y - ts.node.y - 15) ** 2;
      // console.log(ds, de, ds > de);
      onEdit(connection, ds > de);
    }
  }, [connection, onEdit, te, ts]);

  // Just a way to force MobX to re-render us when a node gets deleted.
  if ((ts && ts.node.deleted) || (te && te.node.deleted)) {
    return null;
  }

  const x0: number = ts ? ts.x + ts.node.x + 10 : xs || 0;
  const y0: number = ts ? ts.y + ts.node.y + 15 : ys || 0;
  const x1: number = te ? te.x + te.node.x + 10 : xe || 0;
  const y1: number = te ? te.y + te.node.y + 15 : ye || 0;
  const d = [
    `M${x0} ${y0}`,
    `L${x0 + 5} ${y0}`,
    `C${x0 + 50} ${y0} ${x1 - 50} ${y1} ${x1 - 5} ${y1}`,
    `L${x1} ${y1}`,
  ].join(' ');

  return (
    <g onMouseDown={onMouseDown} className={classNames({ pending })}>
      <ConnectorShadow className="connector-shadow" d={d} transform="translate(0, 3)" />
      <ConnectorOutline className="connector-outline" d={d} />
      <Connector className="connector" d={d} />
    </g>
  );
});
