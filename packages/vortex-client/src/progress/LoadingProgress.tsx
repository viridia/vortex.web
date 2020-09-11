/** @jsx jsx */
import { useContext, useState, useEffect } from 'react';
import { Modal, ModalBody } from '../controls/Modal';
import { Graph } from '../graph';
import { jsx } from '@emotion/core';
import { RendererContext } from '../render/Renderer';
import { observer } from 'mobx-react';
import { reaction } from 'mobx';

interface Props {
  graph: Graph;
}

export const LoadingProgress: React.FC<Props> = observer(({ graph }) => {
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const renderer = useContext(RendererContext);

  useEffect(() => {
    return reaction(() => !graph.loaded, loading => {
      setLoading(loading);
    }, { delay: 1 });
  }, [graph]);

  useEffect(() => {
    return reaction(() => renderer.busy, rendering => {
      setRendering(rendering);
    }, { delay: 1 });
  }, [renderer]);

  return (
    <Modal open={loading || rendering} ariaLabel="Loading" css={{ width: '18rem' }}>
      <ModalBody css={{ alignItems: 'center' }}>
        {rendering ? <span>Rendering&hellip;</span> : <span>Loading&hellip;</span>}
        </ModalBody>
    </Modal>
  );
});
