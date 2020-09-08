import React, { FC } from 'react';
import { Button } from './Button';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './Modal';

interface Props {
  errorMsg: string | null;
  onClose: () => void;
}

export const ErrorDialog: FC<Props> = ({ errorMsg, onClose }) => (
  <Modal
    className="error-dialog"
    open={errorMsg !== null}
    onClose={onClose}
    ariaLabel="Error dialog"
  >
    <ModalHeader>Document load error</ModalHeader>
    <ModalBody>{errorMsg}</ModalBody>
    <ModalFooter className="modal-buttons">
      <Button className="close" onClick={onClose}>
        Close
      </Button>
    </ModalFooter>
  </Modal>
);
