// import LoadGraphDialog from './LoadGraphDialog';
import React, { Component } from 'react';
import bind from 'bind-decorator';
import { Button } from '../controls/Button';
import { ButtonGroup } from '../controls/ButtonGroup';
import { Graph } from '../graph';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../controls/Modal';
import { User } from '../user/User';
import { observer } from 'mobx-react';

// import './GraphActions.scss';

interface Props {
  graph: Graph;
  graphId?: string;
  onSave: () => void;
  onNew: () => void;
}

interface State {
  showConfirmClear: boolean;
  showDownload: boolean;
  showLoad: boolean;
  repeat: number;
}

@observer
export class GraphActions extends Component<Props, State> {
  private downloadEl: HTMLAnchorElement | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      showConfirmClear: false,
      showDownload: false,
      showLoad: false,
      repeat: 1,
    };
  }

  public render() {
    const { graphId } = this.props;
    const { showConfirmClear /*, showDownload, showLoad, repeat */ } = this.state;

    const user: User = this.context.user;
    return (
      <section className="graph-actions">
        <a
          ref={(el: HTMLAnchorElement | null) => {
            this.downloadEl = el;
          }}
          href="https://x"
          style={{ display: 'none' }}
        >
          &nbsp;
        </a>
        <ButtonGroup>
          <Button className="dark" onClick={this.onClickNew}>
            New
          </Button>
          {user?.isLoggedIn !== false && (
            <Button className="dark" onClick={this.onClickLoad}>
              Load&hellip;
            </Button>
          )}
          {graphId ? (
            <Button className="dark" onClick={this.onClickSave}>
              Fork
            </Button>
          ) : (
            <Button className="dark" onClick={this.onClickSave}>
              Save
            </Button>
          )}
          <Button className="dark" onClick={this.onClickDownload}>
            Download
          </Button>
        </ButtonGroup>
        <Modal
          ariaLabel="Clear graph"
          className="confirm"
          open={showConfirmClear}
          onClose={this.onHideConfirmClear}
        >
          <ModalHeader>Clear graph</ModalHeader>
          <ModalBody>Erase all document data?</ModalBody>
          <ModalFooter className="modal-buttons">
            <button className="close" onClick={this.onClickCancelClear}>
              Cancel
            </button>
            <button className="close" onClick={this.onClickConfirmClear}>
              Clear
            </button>
          </ModalFooter>
        </Modal>
        {/* <LoadGraphDialog open={showLoad} onHide={this.onHideLoad} /> */}
      </section>
    );
  }

  @bind
  private onClickLoad(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ showLoad: true });
  }

  @bind
  private onClickSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.props.onSave();
  }

  @bind
  private onClickDownload(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const { graph } = this.props;
    const text = JSON.stringify(graph.toJs(), null, 2);
    this.downloadEl?.setAttribute(
      'href',
      'data:application/json;charset=utf-8,' + encodeURIComponent(text)
    );
    this.downloadEl?.setAttribute('download', graph.name + '.vortex.json');
    this.downloadEl?.click();
  }

  @bind
  private onClickNew() {
    this.props.onNew();
  }

  @bind
  private onClickConfirmClear(e: React.MouseEvent) {
    this.setState({ showConfirmClear: false });
    const { graph } = this.props;
    graph.clear();
  }

  @bind
  private onClickCancelClear(e: React.MouseEvent) {
    this.setState({ showConfirmClear: false });
  }

  @bind
  private onHideConfirmClear() {
    this.setState({ showConfirmClear: false });
  }

  @bind
  private onHideLoad() {
    this.setState({ showLoad: false });
  }
}
