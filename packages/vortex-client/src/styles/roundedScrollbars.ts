import { css } from '@emotion/core';
import { transparentize } from 'polished';

export const roundedScrollbars = css`
  &::-webkit-scrollbar {
    background-color: transparent;
    width: 7px;
    height: 7px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${transparentize(0.8, '#000')};
    border-radius: 6px;
  }

  &::-webkit-scrollbar-thumb:window-inactive {
    background-color: ${transparentize(0.9, '#000')};
  }

  &::-webkit-scrollbar-corner {
    background-color: transparent;
  }
`;
