import { colors } from './colors';
import { css } from '@emotion/core';
import { transparentize } from 'polished';

export const roundedScrollbars = css`
  &::-webkit-scrollbar {
    background-color: transparent;
    width: 11px;
    height: 11px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${transparentize(0.6, '#000')};
    border-radius: 6px;
    border: 2px solid ${colors.panelBg};
  }

  &::-webkit-scrollbar-thumb:window-inactive {
    background-color: ${transparentize(0.7, '#000')};
  }

  &::-webkit-scrollbar-corner {
    background-color: transparent;
  }
`;
