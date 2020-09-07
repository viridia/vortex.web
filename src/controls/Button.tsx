import styled from '@emotion/styled';
import { colors } from '../styles';
import { transparentize } from 'polished';

export const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.buttonTextColor};
  height: 32px;
  padding: 0 12px;
  border-radius: 4px;
  border: 1px solid ${colors.buttonBorderColor};
  background-image: ${colors.buttonBg};
  font-family: 'PT Sans', sans-serif;
  outline: none;
  user-select: none;

  &:active {
    background-image: ${colors.buttonActiveBg};
  }

  &.selected {
    background-image: ${colors.buttonSelectedBg};
  }

  &[disabled] {
    pointer-events: none;
    color: ${transparentize(0.5, colors.buttonTextColor)};
    &.dark {
      color: ${transparentize(0.5, colors.buttonDarkTextColor)};
    }
  }

  &.dark {
    border-color: ${colors.buttonDarkBorderColor};
    background-image: ${colors.buttonDarkBg};
    color: ${colors.buttonDarkTextColor};

    &:active {
      background-image: ${colors.buttonDarkActiveBg};
    }

    &.selected {
      background-image: ${colors.buttonDarkSelectedBg};
    }
  }
`;
