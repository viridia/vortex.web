import React, { FC, useCallback } from 'react';
import classNames from 'classnames';
import styled from '@emotion/styled';
import { Operator } from '../operators';
import { colors } from '../styles';

const RowStyle = styled.div`
  display: flex;
  flex-shrink: 0;
  padding: 0 4px;
  cursor: pointer;

  &:hover {
    background-color: ${colors.listBgHover};
  }

  &.selected {
    background-color: ${colors.listBgSelected};
  }
`;

const RowGroup = styled.div`
  min-width: 5em;
  padding-right: 8px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RowName = styled.div`
  width: 70%;
  font-weight: bold;
`;

interface Props {
  operator: Operator;
  selected: boolean;
  onSelect: (id: string) => void;
  img: HTMLImageElement;
}

export const OperatorCatalogEntry: FC<Props> = ({ operator, selected, onSelect, img }) => {
  const { id, group, name } = operator;

  const onClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    onSelect(id);
  }, [id, onSelect]);

  const onDragStart = useCallback((e: React.DragEvent) => {
    const { id } = operator;
    e.dataTransfer.dropEffect = 'copy';
    e.dataTransfer.setDragImage(img, 45, 60);
    e.dataTransfer.setData('application/x-vortex-operator', `${id}`);
  }, [img, operator]);

  return (
    <RowStyle
      className={classNames('row', { selected })}
      data-id={`${id}`}
      onClick={onClick}
      onDragStart={onDragStart}
      draggable={true}
    >
      <RowGroup className="group">{group}</RowGroup>
      <RowName className="name">{name}</RowName>
    </RowStyle>
  );
};
