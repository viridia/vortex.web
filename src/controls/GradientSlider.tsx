import React, { useMemo } from 'react';
import classNames from 'classnames';
import styled from '@emotion/styled';
import { DragState, usePointerDrag } from '../hooks/usePointerDrag';
import { FC } from 'react';
import { colors } from '../styles';

const GradientSliderElt = styled.div`
  display: inline-block;
  position: relative;
  border: 1px solid ${colors.controlBorder};
  height: 20px;
  border-radius: 10px;
  min-width: 64px;
  overflow: hidden;
  user-select: none;

  &.disabled {
    opacity: .5;
    pointer-events: none;
  }
`;

const GradientSliderBg = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  > .left {
    position: absolute;
    left: 0;
    top: 0;
    width: 10px;
    bottom: 0;
  }
  > .middle {
    position: absolute;
    left: 10px;
    top: 0;
    right: 10px;
    bottom: 0;
  }
  > .right {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 10px;
  }
`;

const GradientSliderTrack = styled.div`
  position: absolute;
  left: 4px;
  right: 17px;
  top: 0;
  bottom: 0;
  > .thumb {
    position: absolute;
    width: 8px;
    height: 8px;
    top: 4px;
    bottom: 4px;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 0 3px #000;
  }
`;

interface Props {
  value: number;
  min?: number;
  max: number;
  className?: string;
  colors: string[];
  disabled?: boolean;
  onChange: (value: number) => void;
}

export const GradientSlider: FC<Props> = ({
  value,
  min = 0,
  max,
  className,
  colors,
  disabled,
  onChange,
}) => {
  const callbacks = useMemo(() => {
    const valueFromX = (ds: DragState) => {
      const dx = ds.x - 13;
      const value = (dx * (max - min)) / (ds.rect.width - 26) + min;
      return Math.min(max, Math.max(min, value));
    };

    return {
      onDragStart(ds: DragState) {
        onChange(valueFromX(ds));
      },
      onDragMove(ds: DragState) {
        onChange(valueFromX(ds));
      },
    };
  }, [onChange, min, max]);

  const ref = usePointerDrag(callbacks);
  const gradient = `linear-gradient(to right, ${colors.join(', ')})`;

  return (
    <GradientSliderElt
      className={classNames('gradient-slider', className, { disabled })}
      ref={ref}
    >
      <GradientSliderBg className="bg">
        <div className="left" style={{ backgroundColor: colors[0] }} />
        <div className="middle" style={{ backgroundImage: gradient }} />
        <div className="right" style={{ backgroundColor: colors[colors.length - 1] }} />
      </GradientSliderBg>
      <GradientSliderTrack className="track">
        <div className="thumb" style={{ left: `${((value - min) * 100) / (max - min)}%` }} />
      </GradientSliderTrack>
    </GradientSliderElt>
  );
};
