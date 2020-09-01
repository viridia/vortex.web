import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { AbstractTerminal } from '../graph/AbstractTerminal';
import { CompassRose } from '../controls/CompassRose';
import {
  Connection,
  Graph,
  GraphNode,
  InputTerminal,
  OutputTerminal,
  Terminal,
  quantize,
} from '../graph';
import { ConnectionRendition } from './ConnectionRendition';
import { NodeRendition } from './NodeRendition';
import { action, runInAction } from 'mobx';
import { colors } from '../styles';
import { darken } from 'polished';
import { isInputTerminal } from '../graph/InputTerminal';
import { isOutputTerminal } from '../graph/OutputTerminal';
import { observer } from 'mobx-react';
import { registry } from '../operators/Registry';

const graphDkBg = darken(0.02, colors.graphBg);

type DragType = 'input' | 'output' | 'node' | null;

const GraphElt = styled.section`
  position: relative;
  flex: 1;
  background-color: ${colors.graphBg};
  background-image: linear-gradient(
      45deg,
      ${graphDkBg} 25%,
      transparent 25%,
      transparent 75%,
      ${graphDkBg} 75%,
      ${graphDkBg}
    ),
    linear-gradient(
      45deg,
      ${graphDkBg} 25%,
      transparent 25%,
      transparent 75%,
      ${graphDkBg} 75%,
      ${graphDkBg}
    );
  background-size: 50px 50px;
  background-position: 0 0, 25px 25px;
  border-left: 1px solid black;
  border-right: 1px solid black;
  user-select: none;
  overflow: hidden;
`;

const GVScroll = styled.div`
  position: absolute;
  left: 0;
  top: 0;
`;

const GVBackdrop = styled.section`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
`;

interface Props {
  graph: Graph;
}

const useNodeDropTarget = (graph: Graph, xScroll: number, yScroll: number) => {
  const [dropValid, setDropValid] = useState(false);

  // For dropping catalog items onto the canvas using drag/drop protocol.
  return useMemo(() => {
    return {
      onDragEnter(e: React.DragEvent<HTMLDivElement>) {
        if (e.dataTransfer.types.indexOf('application/x-vortex-operator') >= 0) {
          e.preventDefault();
        }
        setDropValid(true);
      },

      onDragOver(e: React.DragEvent<HTMLDivElement>) {
        if (e.dataTransfer.types.indexOf('application/x-vortex-operator') >= 0) {
          e.preventDefault();
        }
        setDropValid(true);
      },

      onDragLeave(e: React.DragEvent<HTMLDivElement>) {
        setDropValid(false);
      },

      onDrop(e: React.DragEvent<HTMLDivElement>) {
        const data = e.dataTransfer.getData('application/x-vortex-operator');
        if (dropValid && data) {
          const base = e.currentTarget;
          graph.clearSelection();
          const op = registry.get(data);
          const node = new GraphNode(op, graph.nextId());
          node.x = quantize(e.clientX - base.offsetLeft - xScroll - 45);
          node.y = quantize(e.clientY - base.offsetTop - yScroll - 60);
          node.selected = true;
          graph.add(node);
        }
      },
    };
  }, [graph, xScroll, yScroll, dropValid]);
};

interface State {
  pointerId: number;
  dragX: number;
  dragY: number;
  dragXOffset: number;
  dragYOffset: number;
  dragNode: GraphNode | null;
  dragSource: OutputTerminal | null;
  dragSink: InputTerminal | null;
}

const useGraphDrag = (graph: Graph, xScroll: number, yScroll: number) => {
  const [dragType, setDragType] = useState<DragType>(null);
  const [dxScroll, setDXScroll] = useState(0);
  const [dyScroll, setDYScroll] = useState(0);
  const [dragConnection, setDragConnection] = useState<JSX.Element | null>(null);
  const [editConnection, setEditConnection] = useState<Connection | null>(null);
  const [activeTerminal, setActiveTerminal] = useState<Terminal | null>(null);
  const [state] = useState<State>(() => ({
    pointerId: -1,
    dragX: 0,
    dragY: 0,
    dragXOffset: 0,
    dragYOffset: 0,
    dragNode: null,
    dragSource: null,
    dragSink: null,
  }));

  const pickGraphEntity = useCallback(
    (x: number, y: number): GraphNode | Terminal | undefined => {
      let elt = document.elementFromPoint(x, y);
      while (elt) {
        if (elt instanceof HTMLElement) {
          if (elt.dataset.terminal) {
            const node = graph.findNode(Number(elt.dataset.node));
            return node?.findTerminal(elt.dataset.terminal);
          } else if (elt.dataset.node) {
            return graph.findNode(Number(elt.dataset.node));
          }
        }
        elt = elt.parentElement;
      }
    },
    [graph]
  );

  const updateScrollVelocity = useCallback((e: React.PointerEvent) => {
    const graphEl = e.currentTarget as HTMLElement;
    let dxScroll = 0;
    if (e.clientX < graphEl.offsetLeft) {
      dxScroll = -1;
    } else if (e.clientX > graphEl.offsetLeft + graphEl.offsetWidth) {
      dxScroll = 1;
    }
    setDXScroll(dxScroll);

    let dyScroll = 0;
    if (e.clientY < graphEl.offsetTop) {
      dyScroll = -1;
    } else if (e.clientY > graphEl.offsetTop + graphEl.offsetHeight) {
      dyScroll = 1;
    }
    setDYScroll(dyScroll);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const entity = pickGraphEntity(e.clientX, e.clientY);
      if (entity) {
        if (entity instanceof GraphNode) {
          runInAction(() => {
            if (e.ctrlKey || e.metaKey) {
              entity.selected = !entity.selected;
            } else if (!entity.selected) {
              if (!e.shiftKey) {
                graph.clearSelection();
              }
              entity.selected = true;
            }
          });

          if (entity.selected) {
            state.dragXOffset = e.clientX - entity.x - xScroll;
            state.dragYOffset = e.clientY - entity.y - yScroll;
            state.dragNode = entity;
            state.pointerId = e.pointerId;
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragType('node');
          }
        } else if (entity instanceof AbstractTerminal) {
          const rect = e.currentTarget.getBoundingClientRect();
          state.dragX = e.clientX - rect.left - xScroll;
          state.dragY = e.clientY - rect.top - yScroll;
          setActiveTerminal(null);
          if (isOutputTerminal(entity)) {
            state.dragSource = entity;
            state.dragSink = null;
            setDragType('input'); // Dragging *to* an input terminal
          } else if (isInputTerminal(entity)) {
            state.dragSource = null;
            state.dragSink = entity;
            setDragType('output'); // Dragging *to* an output terminal
          }
          state.pointerId = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);

          setDragConnection(
            <ConnectionRendition
              ts={state.dragSource}
              xs={state.dragX}
              ys={state.dragY}
              te={state.dragSink}
              xe={state.dragX}
              ye={state.dragY}
              pending={!state.dragSource || !state.dragSink}
            />
          );
        }
      } else {
        graph.clearSelection();
      }
    },
    [state, graph, pickGraphEntity, xScroll, yScroll]
  );

  const onPointerMoveNode = useCallback(
    (e: React.PointerEvent) => {
      const graphEl = e.currentTarget as HTMLElement;
      runInAction(() => {
        if (state.dragNode) {
          state.dragNode.x = quantize(
            Math.min(
              graphEl.offsetLeft + graphEl.offsetWidth,
              Math.max(graphEl.offsetLeft, e.clientX)
            ) -
              state.dragXOffset -
              xScroll
          );
          state.dragNode.y = quantize(
            Math.min(
              graphEl.offsetTop + graphEl.offsetHeight,
              Math.max(graphEl.offsetTop, e.clientY)
            ) -
              state.dragYOffset -
              yScroll
          );
        }
        graph.modified = true;
      });

      updateScrollVelocity(e);
    },
    [graph, state, updateScrollVelocity, xScroll, yScroll]
  );

  const onPointerMoveConnection = useCallback(
    (e: React.PointerEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      state.dragX = e.clientX - rect.left - xScroll;
      state.dragY = e.clientY - rect.top - yScroll;

      const entity = pickGraphEntity(e.clientX, e.clientY);
      if (dragType === 'input') {
        state.dragSink =
          entity &&
          entity instanceof AbstractTerminal &&
          isInputTerminal(entity) &&
          state.dragSource &&
          !graph.detectCycle(state.dragSource, entity)
            ? entity
            : null;
        setActiveTerminal(state.dragSink);
      } else {
        state.dragSource =
          entity &&
          entity instanceof AbstractTerminal &&
          isOutputTerminal(entity) &&
          state.dragSink &&
          !graph.detectCycle(entity, state.dragSink)
            ? entity
            : null;
        setActiveTerminal(state.dragSource);
      }

      setDragConnection(
        <ConnectionRendition
          ts={state.dragSource}
          xs={state.dragX}
          ys={state.dragY}
          te={state.dragSink}
          xe={state.dragX}
          ye={state.dragY}
          pending={!state.dragSource || !state.dragSink}
        />
      );

      updateScrollVelocity(e);
    },
    [state, dragType, graph, pickGraphEntity, updateScrollVelocity, xScroll, yScroll]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      runInAction(() => {
        if (dragType === 'input' || dragType === 'output') {
          if (editConnection) {
            editConnection.source.disconnect(editConnection);
            editConnection.dest.connection = null;
          }

          if (state.dragSource && state.dragSink) {
            graph.connectTerminals(state.dragSource, state.dragSink);
          }
        }
      });

      e.currentTarget.releasePointerCapture(state.pointerId);
      setDragType(null);
      setDragConnection(null);
      setEditConnection(null);
      setActiveTerminal(null);
      setDXScroll(0);
      setDYScroll(0);
      state.dragSource = null;
      state.dragSink = null;
      state.pointerId = -1;
    },
    [dragType, state, editConnection, graph]
  );

  const onConnectionPointerDown = useCallback(
    (e: React.PointerEvent<SVGElement>) => {
      e.stopPropagation();
      const sourceId = e.currentTarget.dataset.source?.split(':', 2);
      const sinkId = e.currentTarget.dataset.sink?.split(':');
      const ts = sourceId ? graph.findOutputTerminal(sourceId[0], sourceId[1]) : undefined;
      const te = sinkId ? graph.findInputTerminal(sinkId[0], sinkId[1]) : undefined;
      const connection = te && te.connection;

      if (ts && te && connection) {
        const svgDoc = e.currentTarget.parentNode as SVGSVGElement;
        const graphEl = svgDoc.parentElement!;

        // Determine which endpoint is closer to the pointer coordinates. That's the one to drag.
        const clientRect = svgDoc.getBoundingClientRect();
        const x = e.clientX - clientRect.left + svgDoc.viewBox.baseVal.x;
        const y = e.clientY - clientRect.top + svgDoc.viewBox.baseVal.y;

        const de = (x - te.x - te.node.x - 10) ** 2 + (y - te.y - te.node.y - 10) ** 2;
        const ds = (x - ts.x - ts.node.x - 10) ** 2 + (y - ts.y - ts.node.y - 10) ** 2;

        const rect = graphEl.getBoundingClientRect();
        state.dragX = e.clientX - rect.left;
        state.dragY = e.clientY - rect.top;

        if (ds > de) {
          state.dragSource = ts;
          state.dragSink = null;
          setDragType('input'); // Dragging *to* an input terminal
        } else {
          state.dragSource = null;
          state.dragSink = te;
          setDragType('output'); // Dragging *to* an output terminal
        }

        state.pointerId = e.pointerId;
        graphEl.setPointerCapture(e.pointerId);

        setDragConnection(
          <ConnectionRendition
            ts={state.dragSource}
            xs={state.dragX}
            ys={state.dragY}
            te={state.dragSink}
            xe={state.dragX}
            ye={state.dragY}
            pending={!state.dragSource || !state.dragSink}
          />
        );
        setEditConnection(connection);
      }
    },
    [graph, state]
  );

  useEffect(
    action(() => {
      if (activeTerminal) {
        activeTerminal.hover = true;
        return action(() => {
          activeTerminal.hover = false;
        });
      }
    }),
    [activeTerminal]
  );

  // Methods to spread into graph element
  const dragMethods = {
    onPointerDown,
    ...(dragType === 'node' && {
      onPointerMove: onPointerMoveNode,
      onPointerUp,
    }),
    ...((dragType === 'input' || dragType === 'output') && {
      onPointerMove: onPointerMoveConnection,
      onPointerUp,
    }),
  };

  // Methods to spread into connection element
  const connMethods = {
    onPointerDown: onConnectionPointerDown,
  };

  return {
    dragMethods,
    connMethods,
    dragConnection,
    editConnection,
    dxScroll,
    dyScroll,
  };
};

export const GraphView: FC<Props> = observer(({ graph }) => {
  const scrollEl = useRef<HTMLDivElement>(null);
  const [xScroll, setXScroll] = useState(0);
  const [yScroll, setYScroll] = useState(0);

  const onScroll = useCallback(
    (dx: number, dy: number) => {
      setXScroll(xScroll + dx);
      setYScroll(yScroll + dy);
    },
    [xScroll, yScroll]
  );

  const dndMethods = useNodeDropTarget(graph, xScroll, yScroll);
  const {
    dragMethods,
    connMethods,
    dragConnection,
    editConnection,
    dxScroll,
    dyScroll,
  } = useGraphDrag(graph, xScroll, yScroll);

  useEffect(() => {
    if (dxScroll !== 0 || dyScroll !== 0) {
      const timer = window.setInterval(() => {
        onScroll(-dxScroll * 10, -dyScroll * 10);
      }, 16);

      return () => window.clearInterval(timer);
    }
  }, [onScroll, dxScroll, dyScroll]);

  const bounds = graph.bounds;

  const connections: JSX.Element[] = [];
  for (const node of graph.nodes) {
    for (const output of node.outputs) {
      for (const connection of output.connections) {
        const input = connection.dest;
        if (
          editConnection &&
          connection.dest === editConnection.dest &&
          connection.source === editConnection.source
        ) {
          continue;
        }
        connections.push(
          <ConnectionRendition
            {...connMethods}
            key={`${node.id}_${output.id}_${input.node.id}_${input.id}`}
            ts={connection.source}
            te={connection.dest}
            connection={connection}
          />
        );
      }
    }
  }

  return (
    <GraphElt {...dndMethods} {...dragMethods} id="graph">
      <GVBackdrop className="backdrop" />
      <GVScroll
        ref={scrollEl}
        className="scroll"
        style={{ left: `${xScroll}px`, top: `${yScroll}px` }}
      >
        {graph.nodes.map(node => (
          <NodeRendition key={node.id} node={node} graph={graph} onScroll={onScroll} />
        ))}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'absolute', left: `${bounds.xMin}px`, top: `${bounds.yMin}px` }}
          viewBox={`${bounds.xMin} ${bounds.yMin} ${bounds.width} ${bounds.height}`}
          className="connectors"
          width={bounds.width}
          height={bounds.height}
        >
          {connections}
          {dragConnection}
        </svg>
      </GVScroll>
      <CompassRose onScroll={onScroll} />
    </GraphElt>
  );
});
