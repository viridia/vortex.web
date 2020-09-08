/** @jsx jsx */
import copy from 'copy-to-clipboard';
import styled from '@emotion/styled';
import { Button } from '../controls/Button';
import { FC, useCallback, useEffect, useState } from 'react';
import { GraphNode } from '../graph';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../controls/Modal';
import { autorun } from 'mobx';
import { colors } from '../styles';
import { jsx } from '@emotion/core';

const ShaderSourceElt = styled(Modal)`
  max-width: 95%;
  height: 95%;
`;

const SourceScroll = styled.section`
  flex-shrink: 1;
  font-family: monospace;
  overflow-y: auto;
  background-color: #dec;
  border: 1px inset ${colors.panelBg};
  margin: 0;
  padding: 4px;
`;

const SourceDisplayTable = styled.table`
  font-size: 12px;
  min-height: 0;

  td.index {
    color: #9a9;
    user-select: none;
    text-align: right;
    padding-right: 8px;
  }

  td.text {
    white-space: pre;
  }
`;

interface Props {
  node: GraphNode;
  open: boolean;
  onClose: () => void;
}

export const ShaderSourceDialog: FC<Props> = ({ node, open, onClose }) => {
  const [source, setSource] = useState('');

  useEffect(() => {
    return autorun(() => {
      setSource(node.source);
    });
  }, [node]);

  const onCopy = useCallback(() => {
    copy(source);
  }, [source]);

  return (
    <ShaderSourceElt
      className="shader-source"
      open={open}
      onClose={onClose}
      ariaLabel="Shader source"
    >
      <ModalHeader>
        Generated shader code for {node.operator.name}:{node.id}
      </ModalHeader>
      <ModalBody css={{ overflow: 'hidden' }}>
        <SourceScroll className="source-scroll">
          <SourceDisplayTable className="source">
            <tbody>
              {open &&
                source.split('\n').map((line, i) => (
                  <tr key={`${i}`}>
                    <td className="index">{i + 1}</td>
                    <td className="text">{line}{'\n'}</td>
                  </tr>
                ))}
            </tbody>
          </SourceDisplayTable>
        </SourceScroll>
      </ModalBody>
      <ModalFooter>
        <Button className="copy" onClick={onCopy}>
          Copy to Clipboard
        </Button>
        <Button className="close" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </ShaderSourceElt>
  );
};
