import React, { FC, useContext, useEffect, useState } from 'react';
import opDragImg from '../images/opdrag.png';
import styled from '@emotion/styled';
import { Operator } from '../operators';
import { OperatorCatalogEntry } from './OperatorCatalogEntry';
import { RegistryContext } from '../operators/Registry';
import { colors, roundedScrollbars } from '../styles';

const OperatorCatalogStyle = styled.section`
  ${roundedScrollbars}
  border: 1px inset;
  margin: 8px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  background-color: ${colors.listBg};
  user-select: none;
  overflow-y: scroll;
  flex: 3 1 0;
`;

interface Props {
  selected: Operator | null;
  onSelect: (id: string) => void;
}

export const OperatorCatalog: FC<Props> = ({ selected, onSelect }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const registry = useContext(RegistryContext);

  useEffect(() => {
    const img = document.createElement('img');
    img.src = opDragImg;
    setImage(img);
  }, []);

  const opList = registry.list.map(
    (op: Operator) => [op.group, op.name, op] as [string, string, Operator]
  );
  opList.sort();

  return image && (
    <OperatorCatalogStyle className="operator-catalog">
      {opList.map(([, , op]: [string, string, Operator]) => (
        <OperatorCatalogEntry
          key={`${op.id}`}
          operator={op}
          selected={selected === op}
          onSelect={onSelect}
          img={image}
        />
      ))}
      <div />
    </OperatorCatalogStyle>
  );
}
