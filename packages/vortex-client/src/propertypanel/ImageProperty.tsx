import Axios from 'axios';
import React, { FC, useCallback, useContext, useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Button } from '../controls/Button';
import { Graph, GraphNode } from '../graph';
import { Observer } from 'mobx-react';
import { Parameter } from '../operators';
import { RendererContext } from '../render/Renderer';
import { axiosInstance } from '../network';
import { reaction, runInAction } from 'mobx';

const ImagePropertyPanel = styled.section`
  display: flex;
  flex-direction: column;
  margin-bottom: 4px;
  margin-top: 4px;
  flex-shrink: 0;
`;

const UploadButton = styled(Button)`
  align-self: stretch;
`;

const NoImage = styled.span`
  font-style: italic;
`;

interface Props {
  parameter: Parameter;
  node: GraphNode;
  graph: Graph;
}

/** Property editor for Image resources. */
export const ImageProperty: FC<Props> = ({ parameter, node, graph }) => {
  const fileEl = useRef<HTMLInputElement>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const renderer = useContext(RendererContext);

  const onClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    fileEl.current?.click();
  }, []);

  useEffect(() => {
    return reaction(
      () => node.paramValues.get(parameter.id),
      url => {
        if (url) {
          Axios.head(url).then(resp => {
            const name = resp.headers['x-amz-meta-name'];
            if (name) {
              setImageName(name);
            } else if (name) {
              setImageName(null);
            }
          });
        }
      }
    );
  }, [node, parameter]);

  const onFileChanged = useCallback(() => {
    if (fileEl.current && fileEl.current.files && fileEl.current.files.length > 0) {
      const file = fileEl.current.files[0];
      const formData = new FormData();
      formData.append('attachment', file);
      axiosInstance.post('/api/images', formData).then(resp => {
        renderer.loadTexture(resp.data.url, texture => {
          runInAction(() => {
            node.glResources?.textures.set(parameter.id, texture);
            node.paramValues.set(parameter.id, resp.data.url);
            graph.modified = true;
          });
        });
      });
    } else {
      runInAction(() => {
        node.paramValues.set(parameter.id, null);
        graph.modified = true;
      });
    }
  }, [graph, node, parameter, renderer]);

  return (
    <Observer>
      {() => (
        <ImagePropertyPanel className="image-property">
          <input
            ref={fileEl}
            type="file"
            style={{ display: 'none' }}
            accept="image/*"
            onChange={onFileChanged}
          />
          <UploadButton onClick={onClick}>
            {node.paramValues.get(parameter.id) ? (
              <React.Fragment>
                <span className="name">{parameter.name}:&nbsp;</span>
                <span className="value">{imageName}</span>
              </React.Fragment>
            ) : (
              <NoImage>Upload an image</NoImage>
            )}
          </UploadButton>
        </ImagePropertyPanel>
      )}
    </Observer>
  );
};
