import styled from '@emotion/styled';

export const ButtonGroup = styled.div`
  display: flex;
  > button {
    border-right-width: 0;
    border-radius: 0;
    &:first-of-type {
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
    }
    &:last-of-type {
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
      border-right-width: 1px;
    }
  }
`;
