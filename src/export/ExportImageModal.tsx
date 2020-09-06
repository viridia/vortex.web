import React, { FC, useCallback, useRef, useState } from 'react';
import download from 'downloadjs';
import styled from '@emotion/styled';
import { Button } from '../controls/Button';
import { GraphNode } from '../graph';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../controls/Modal';
import { RenderedImage } from '../render/RenderedImage';
import { colors, roundedScrollbars } from '../styles';
import { observer } from 'mobx-react';

const DialogBody = styled(ModalBody)`
  ${roundedScrollbars}
  flex-basis: auto;
  overflow: auto;
  justify-content: space-around;
  align-items: center;
`;

const Select = styled.select`
  height: 32px;
  padding: 0 12px;
  border-radius: 4;
  border: 1px solid ${colors.buttonBorderColor};
  background-image: ${colors.buttonBg};
  outline: none;
`;

const SIZES = [64, 128, 256, 512, 1024, 2048];

interface Props {
  show: boolean;
  onClose: () => void;
  node: GraphNode;
}

export const ExportImageModal: FC<Props> = observer(({ node, show, onClose }) => {
  const image = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(512);

  const onClickDownload = useCallback(
    (e: React.MouseEvent) => {
      image.current?.toBlob(img => {
        if (img) {
          download(img, `${node.name}-${node.id}.png`, 'image/png');
        }
      }, 'image/png');
    },
    [node, image]
  );

  const onChangeSize = useCallback((e: any) => {
    setSize(Number(e.target.value));
  }, []);

  return (
    <Modal className="export-image" open={show} onClose={onClose} ariaLabel="Export image">
      <ModalHeader>
        Generated image for {node.operator.name}:{node.id}
      </ModalHeader>
      <DialogBody>
        <RenderedImage node={node} width={size} height={size} ref={image} />
      </DialogBody>
      <ModalFooter className="modal-buttons">
        <Select onChange={onChangeSize} value={size}>
          {SIZES.map(sz => {
            const ss = sz.toString();
            return (
              <option key={ss} value={ss}>
                {ss} x {ss}
              </option>
            );
          })}
        </Select>
        <Button className="close" onClick={onClose}>
          Close
        </Button>
        <Button className="close" onClick={onClickDownload}>
          Download
        </Button>
      </ModalFooter>
    </Modal>
  );
});
