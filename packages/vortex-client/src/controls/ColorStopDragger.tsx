import React from 'react';
import classNames from 'classnames';
import styled from '@emotion/styled';
import { FC } from 'react';
import { RGBAColor, formatCssColor } from '../render/colors';

const ColorStopDraggerElt = styled.div`
  position: absolute;
  bottom: -10px;
  z-index: 10;
  cursor: pointer;

  > svg {
    position: relative;
    left: -8px;

    > path {
      stroke: #000;
      stroke-width: 1px;
      stroke-linejoin: round;
    }
  }

  &.selected > .swatch {
    border-color: #fff;
  }
`;

const ColorStopSwatch = styled.div`
  position: absolute;
  background-color: red;
  border-radius: 1px;
  width: 7px;
  height: 8px;
  border: 1px solid black;
  left: -4px;
  top: 10px;
`;

interface Props {
  color: RGBAColor;
  selected: boolean;
  value: number;
  index: number;
}

export const ColorStopDragger: FC<Props> = ({
  color,
  selected,
  value,
  index,
}) => {
  return (
    <ColorStopDraggerElt
      className={classNames('color-stop-dragger', { selected })}
      style={{ left: `${value * 100}%` }}
      data-stopindex={index}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="25" viewBox="-1 -1 16 24">
        <defs>
          <linearGradient id="a" gradientTransform="rotate(65 -4 -2)">
            <stop offset="0" stopColor="#dedede" />
            <stop offset=".3" stopColor="#9d9d9d" />
            <stop offset=".6" stopColor="#747474" />
          </linearGradient>
        </defs>
        <path d="M2 8 L8 2 L14 8 V22 H2z" fill="#000" opacity=".3" />
        <path d="M1 7 L7 1 L13 7 V21 H1z" fill="url(#a)" />
      </svg>
      <ColorStopSwatch className="swatch" style={{ backgroundColor: formatCssColor(color) }} />
    </ColorStopDraggerElt>
  );
};
