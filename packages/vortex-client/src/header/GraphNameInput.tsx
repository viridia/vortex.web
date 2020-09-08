import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Graph } from '../graph';
import { colors } from '../styles';
import { darken } from 'polished';
import { observer } from 'mobx-react';
import { runInAction } from 'mobx';

interface Props {
  graph: Graph;
}

const NameInputField = styled.input`
  flex: 1;
  background-color: ${colors.headerBg};
  vertical-align: middle;
  padding: 7px 4px;
  margin: 0 12px 0 0;
  color: ${darken(0.3, colors.headerColor)};
  border: none;
  border-radius: 4px;
  outline: none;

  &.modified {
    color: ${darken(0.15, colors.headerColor)};
  }

  &:focus {
    color: ${darken(0.05, colors.headerColor)};
    background-color: lighten($headerBg, 10%);
  }
`;

export const GraphNameInput: FC<Props> = observer(({ graph }) => {
  const [name, setName] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(graph.name);
  }, [graph]);

  const onBlur = useCallback(() => {
    runInAction(() => {
      graph.name = name;
      graph.modified = true;
    });
  }, [graph, name]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.keyCode === 13) {
        runInAction(() => {
          graph.name = name;
          graph.modified = true;
        });
        ref.current?.blur();
      }
    },
    [graph, name]
  );

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  return (
    <NameInputField
      ref={ref}
      className="name-input"
      type="text"
      value={name}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      maxLength={64}
      placeholder={graph.loaded ? 'Untitled document' : 'Loading...'}
    />
  );
});
