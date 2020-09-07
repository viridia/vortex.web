import React, { FC, useCallback, useContext, useRef, useState } from 'react';
import { Button } from '../controls/Button';
import { ButtonGroup } from '../controls/ButtonGroup';
import { Graph } from '../graph';
import { LoadGraphDialog } from './LoadGraphDialog';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../controls/Modal';
import { SessionContext } from '../Session';
import { observer } from 'mobx-react';

interface Props {
  graph: Graph;
  docId?: string;
  onSave: () => void;
  onNew: () => void;
}

export const GraphActions: FC<Props> = observer(({ graph, docId, onNew, onSave }) => {
  const downloadEl = useRef<HTMLAnchorElement>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showLoad, setShowLoad] = useState(false);
  const session = useContext(SessionContext);

    const onClickLoad = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowLoad(true);
    }, []);

    const onClickSave = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSave();
    }, [onSave]);

    const onClickDownload = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const text = JSON.stringify(graph.toJs(), null, 2);
      if (downloadEl.current) {
        downloadEl.current.setAttribute(
          'href',
          'data:application/json;charset=utf-8,' + encodeURIComponent(text)
        );
        downloadEl.current.setAttribute('download', graph.name + '.vortex.json');
        downloadEl.current.click();
      }
    }, [graph]);

    const onClickNew = useCallback(() => {
      onNew();
    }, [onNew]);

    const onClickConfirmClear = useCallback(() => {
      setShowConfirmClear(false);
      graph.clear();
    }, [graph]);

    const onClickCancelClear = useCallback(() => {
      setShowConfirmClear(false);
    }, []);

    const onHideConfirmClear = useCallback(() => {
      setShowConfirmClear(false);
    }, []);

    const onCloseLoad = useCallback(() => {
      setShowLoad(false);
    }, []);

  return (
    <section className="graph-actions">
      <a
        ref={downloadEl}
        href="https://x"
        style={{ display: 'none' }}
      >
        &nbsp;
      </a>
      <ButtonGroup>
        <Button className="dark" onClick={onClickNew}>
          New
        </Button>
        {session.isLoggedIn !== false && (
          <Button className="dark" onClick={onClickLoad}>
            Load&hellip;
          </Button>
        )}
        {session.isLoggedIn && graph.ownedByAnother ? (
          <Button className="dark" onClick={onClickSave}>
            Fork
          </Button>
        ) : (
          <Button className="dark" onClick={onClickSave} disabled={!graph.modified}>
            Save
          </Button>
        )}
        <Button className="dark" onClick={onClickDownload}>
          Download
        </Button>
      </ButtonGroup>
      <Modal
        ariaLabel="Clear graph"
        className="confirm"
        open={showConfirmClear}
        onClose={onHideConfirmClear}
      >
        <ModalHeader>Clear graph</ModalHeader>
        <ModalBody>Erase all document data?</ModalBody>
        <ModalFooter className="modal-buttons">
          <button className="close" onClick={onClickCancelClear}>
            Cancel
          </button>
          <button className="close" onClick={onClickConfirmClear}>
            Clear
          </button>
        </ModalFooter>
      </Modal>
      <LoadGraphDialog open={showLoad} onClose={onCloseLoad} />
    </section>
  );
});
