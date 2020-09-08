import React, { FC, useCallback, useContext, useState } from 'react';
import styled from '@emotion/styled';
import { Operator } from '../operators';
import { OperatorCatalog } from './OperatorCatalog';
import { OperatorDetails } from './OperatorDetails';
import { RegistryContext } from '../operators/Registry';
import { colors } from '../styles';

const ToolPanelAside = styled.aside`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 25%;
  max-width: 300px;
  background-color: ${colors.panelBg};

  .note {
    margin: 8px 8px 0 8px;
    font-size: 14px;
  }
`;

export const CatalogPanel: FC = () => {
  const [operator, setOperator] = useState<Operator | null>(null);
  const registry = useContext(RegistryContext);

  const onSelectOperator = useCallback((id: string) => {
    setOperator(registry.get(id));
  }, [registry]);

  return (
    <ToolPanelAside id="tool-panel">
      <section className="note">Drag an operator to the graph:</section>
      <OperatorCatalog selected={operator} onSelect={onSelectOperator} />
      <OperatorDetails operator={operator} />
    </ToolPanelAside>
  );
};
