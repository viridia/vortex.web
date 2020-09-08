import React, { FC } from 'react';
import styled from '@emotion/styled';
import { Markdown } from '../controls/Markdown';
import { Operator } from '../operators';
import { roundedScrollbars } from '../styles';

const DetailsText = styled(Markdown)`
  ${roundedScrollbars}
  border: 1px inset;
  margin: 0 8px 8px 8px;
  padding: 4px;
  user-select: none;
  overflow-y: auto;
  flex: 2 1 0;
  font-size: 14px;

  > p:first-of-type {
    margin-top: 0;
  }
`;

interface Props {
  operator: Operator | null;
}

export const OperatorDetails: FC<Props> = ({ operator }) => (
  <DetailsText className="operator-details" markdown={(operator && operator.description) || ''} />
);
