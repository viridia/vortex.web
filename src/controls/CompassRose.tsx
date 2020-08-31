import React from 'react';
import styled from '@emotion/styled';
import { FC, useMemo } from 'react';
import { MomentaryButton } from './MomentaryButton';

// import './CompassRose.scss';

const arrowWidth = '24px';
const compassWidth = '90px';
const centerWidth = '16px';
const margin = '16px';

const CompassRoseDiv = styled.div`
  position: absolute;
  right: ${margin};
  bottom: ${margin};
  width: ${compassWidth};
  height: ${compassWidth};
  font-family: sans-serif;

  > .arrow {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0.3;

    &:hover {
      opacity: 0.6;
    }

    &.active {
      opacity: 0.9;
    }

    &.north {
      top: 0;
      left: calc((${compassWidth} - ${arrowWidth}) / 2);
      border-bottom: ${arrowWidth} solid white;
      border-left: calc(${arrowWidth} / 2) solid transparent;
      border-right: calc(${arrowWidth} / 2) solid transparent;
    }

    &.east {
      top: calc((${compassWidth} - ${arrowWidth}) / 2);
      right: 0;
      border-left: ${arrowWidth} solid white;
      border-top: calc(${arrowWidth} / 2) solid transparent;
      border-bottom: calc(${arrowWidth} / 2) solid transparent;
    }

    &.south {
      bottom: 0;
      left: calc((${compassWidth} - ${arrowWidth}) / 2);
      border-top: ${arrowWidth} solid white;
      border-left: calc(${arrowWidth} / 2) solid transparent;
      border-right: calc(${arrowWidth} / 2) solid transparent;
    }

    &.west {
      left: 0;
      top: calc((${compassWidth} - ${arrowWidth}) / 2);
      border-right: ${arrowWidth} solid white;
      border-top: calc(${arrowWidth} / 2) solid transparent;
      border-bottom: calc(${arrowWidth} / 2) solid transparent;
    }
  }

  > .center {
    position: absolute;
    width: ${centerWidth};
    height: ${centerWidth};
    background-color: white;
    border-radius: 50%;
    left: calc((${compassWidth} - ${centerWidth}) / 2);
    top: calc((${compassWidth} - ${centerWidth}) / 2);
    opacity: 0.3;

    &:hover {
      opacity: 0.6;
    }

    &.active {
      opacity: 0.9;
    }
  }
`;

interface Props {
  onScroll: (dx: number, dy: number) => void;
}

export const CompassRose: FC<Props> = ({ onScroll }) => {
  const callbacks = useMemo(() => {
    return {
      north: () => onScroll(0, 10),
      east: () => onScroll(-10, 0),
      south: () => onScroll(0, -10),
      west: () => onScroll(10, 0),
    };
  }, [onScroll]);

  return (
    <CompassRoseDiv className="compass-rose">
      <MomentaryButton className="arrow north" delay={0} onHeld={callbacks.north} />
      <MomentaryButton className="arrow east" delay={0} onHeld={callbacks.east} />
      <MomentaryButton className="arrow south" delay={0} onHeld={callbacks.south} />
      <MomentaryButton className="arrow west" delay={0} onHeld={callbacks.west} />
      <MomentaryButton className="center" />
    </CompassRoseDiv>
  );
};
