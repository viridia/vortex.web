import React from 'react';
import bind from 'bind-decorator';
import classNames from 'classnames';
import lockImg from '../images/lock.png';
import styled from '@emotion/styled';
import { Button } from '../controls/Button';
import { ButtonGroup } from '../controls/ButtonGroup';
import { Component } from 'react';
import { ExportImageModal } from '../export/ExportImageModal';
import { GraphNode } from '../graph';
import { ShaderSourceDialog } from './ShaderSourceDialog';
import { observer } from 'mobx-react';

// import './NodeActions.scss';

const NodeActionsElt = styled.section`
  display: flex;
  margin: 4px 4px 0 4px;

  .spacer {
    flex: 1;
  }

  button {
    border-collapse: collapse;
    padding: 0 10px;
  }
`;

interface Props {
  node: GraphNode;
  onSetTiling: (tiling: number) => void;
  locked: boolean;
  onLock: (lock: boolean) => void;
}

interface State {
  showSource: boolean;
  showExport: boolean;
  repeat: number;
}

@observer
export class NodeActions extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showSource: false,
      showExport: false,
      repeat: 1,
    };
  }

  public render() {
    const { node, locked } = this.props;
    const { showSource, showExport, repeat } = this.state;
    return (
      <NodeActionsElt className="node-actions">
        <ButtonGroup className="Button-group">
          <Button
            className={classNames({ selected: repeat === 1 })}
            onClick={() => this.setRepeat(1)}
          >
            1x1
          </Button>
          <Button
            className={classNames({ selected: repeat === 2 })}
            onClick={() => this.setRepeat(2)}
          >
            2x2
          </Button>
          <Button
            className={classNames({ selected: repeat === 3 })}
            onClick={() => this.setRepeat(3)}
          >
            3x3
          </Button>
        </ButtonGroup>
        <div className="spacer" />
        <Button className={classNames({ selected: locked })} onClick={this.toggleLock}>
          <img className="lock" src={lockImg} width="12" style={{ opacity: '.6' }} alt="Lock" />
        </Button>
        <div className="spacer" />
        <Button onClick={this.onClickShowSource}>Source&hellip;</Button>
        <div className="spacer" />
        <Button onClick={this.onClickShowExport}>Export&hellip;</Button>
        <ShaderSourceDialog open={showSource} onClose={this.onHideSource} node={node} />
        <ExportImageModal node={node} show={showExport} onClose={this.onHideExport} />
      </NodeActionsElt>
    );
  }

  @bind
  private onClickShowSource(e: React.MouseEvent) {
    this.setState({ showSource: true });
  }

  @bind
  private onClickCloseSource(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ showSource: false });
  }

  @bind
  private onHideSource() {
    this.setState({ showSource: false });
  }

  @bind
  private onClickShowExport(e: React.MouseEvent) {
    this.setState({ showExport: true });
  }

  @bind
  private onHideExport() {
    this.setState({ showExport: false });
  }

  @bind
  private setRepeat(repeat: number) {
    this.setState({ repeat });
    this.props.onSetTiling(repeat);
  }

  @bind
  private toggleLock() {
    this.props.onLock(!this.props.locked);
  }
}
