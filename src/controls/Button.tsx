import styled from '@emotion/styled';
import { colors } from '../styles';

export const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
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
    opacity: .5;
    pointer-events: none;
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

    &[disabled] {
      opacity: .7;
    }
  }

`;
