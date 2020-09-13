import React, { Component } from 'react';
import bind from 'bind-decorator';
import styled from '@emotion/styled';
import { Graph, GraphNode } from '../graph';
import { NodeActions } from './NodeActions';
import { PropertyEditor } from '../propertypanel/PropertyEditor';
import { RenderedImage } from '../render/RenderedImage';
import { colors, roundedScrollbars } from '../styles';
import { observer } from 'mobx-react';

const PropertyPanelElt = styled.aside`
  display: flex;
  flex-direction: column;
  width: 330px;
  background-color: ${colors.panelBg};
  min-height: 0;
`;

const RenderedImagePreview = styled(RenderedImage)`
  margin: 4px;
`;

const NodeErrorDisplay = styled.div`
  ${roundedScrollbars}
  font-family: monospace;
  width: 320px;
  height: 320px;
  margin: 4px;
  padding: 8px;
  background-color: ${colors.errorTextBg};
  overflow: auto;
  white-space: pre;
`;

interface Props {
  graph: Graph;
}

interface State {
  tiling: number;
  lockedNode: GraphNode | null;
}

@observer
export class PropertyPanel extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      tiling: 1,
      lockedNode: null,
    };
  }

  public render() {
    const { graph } = this.props;
    const { tiling, lockedNode } = this.state;
    const selection = graph.selection;
    const selectedNode = selection.length === 1 ? selection[0] : null;
    const previewNode = lockedNode || selectedNode;
    return (
      <PropertyPanelElt id="property-panel">
        {selectedNode && <PropertyEditor graph={graph} node={selectedNode} />}
        {selectedNode && (
          <NodeActions
            node={selectedNode}
            locked={lockedNode !== null}
            onSetTiling={this.onSetTiling}
            onLock={this.onLock}
          />
        )}
        {selectedNode &&
          (selectedNode.error ? (
            <NodeErrorDisplay>{selectedNode.error}</NodeErrorDisplay>
          ) : (
            <RenderedImagePreview node={previewNode} width={320} height={320} tiling={tiling} />
          ))}
      </PropertyPanelElt>
    );
  }

  @bind
  private onSetTiling(tiling: number) {
    this.setState({ tiling });
  }

  @bind
  private onLock(lock: boolean) {
    const selection = this.props.graph.selection;
    const selectedNode = selection.length === 1 ? selection[0] : null;
    this.setState({ lockedNode: lock ? selectedNode : null });
  }
}
