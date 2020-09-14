import React, { FC, useCallback, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import styled from '@emotion/styled';
import { DragMethods, usePointerDrag } from '../hooks/usePointerDrag';
import { MomentaryButton } from './MomentaryButton';
import { colors } from '../styles';
import { darken, lighten } from 'polished';

const ComboSliderElt = styled.div`
  display: inline-flex;
  position: relative;
  align-items: stretch;
  position: relative;
  border: 1px solid ${colors.controlBorder};
  border-top: none;
  height: 24px;
  min-width: 64px;
  overflow: hidden;
  user-select: none;
  cursor: pointer;

  &:first-child {
    border-top: 1px solid ${colors.controlBorder};
    border-top-right-radius: 6px;
    border-top-left-radius: 6px;
  }

  &:last-child {
    border-bottom-right-radius: 6px;
    border-bottom-left-radius: 6px;
  }

  &.textActive > .center {
    > .name,
    > .value {
      display: none;
    }

    > input {
      display: block;
    }
  }
`;

const ComboSliderArrowButton = styled(MomentaryButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  &:after {
    position: relative;
    font-size: 12px;
    line-height: 24px;
    color: ${darken(0.3, colors.comboBg)};
  }
  &.active:after {
    color: #000;
  }
  &:hover {
    background-color: ${lighten(0.1, colors.comboBg)};
  }
`;

const ComboSliderArrowButtonLeft = styled(ComboSliderArrowButton)`
  &:after {
    content: '\\25c0';
  }
`;

const ComboSliderArrowButtonRight = styled(ComboSliderArrowButton)`
  &:after {
    content: '\\25b6';
  }
`;

const ComboSliderContainer = styled.div`
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-size: 14px;
  text-align: center;
  vertical-align: middle;
`;

const ComboSliderName = styled.span`
  margin-right: 4px;
`;

const ComboSliderInput = styled.input`
  display: none;
  background-color: transparent;
  position: absolute;
  text-align: center;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  border: none;
`;

// TODO: log scale testing

interface Props {
  name: string;
  value: number;
  min?: number;
  max: number;
  precision?: number; // 0 = integer, undefined == unlimited
  increment?: number;
  logScale?: boolean;
  enumVals?: string[];
  className?: string;
  onChange: (value: number) => void;
}

export const ComboSlider: FC<Props> = ({
  name,
  value,
  min = 0,
  max,
  precision,
  increment = 1,
  logScale = false,
  className,
  enumVals,
  onChange,
}) => {
  const element = useRef<HTMLDivElement>(null);
  const inputEl = useRef<HTMLInputElement>(null);
  const [dragOrigin, setDragOrigin] = useState(0);
  const [dragValue, setDragValue] = useState(0);
  const [textActive, setTextActive] = useState(false);

  const setValue = useCallback(
    (value: number) => {
      let newValue = value;
      if (precision !== undefined) {
        const mag = 10 ** precision;
        newValue = Math.round(newValue * mag) / mag;
      }
      onChange(Math.min(max, Math.max(min, newValue)));
    },
    [max, min, onChange, precision]
  );

  const buttonMethods = useMemo(
    () => ({
      onLeftChange(active: boolean) {
        if (active) {
          setValue(value - increment);
        }
      },

      onLeftHeld() {
        setValue(value - increment);
      },

      onRightChange(active: boolean) {
        if (active) {
          setValue(value + increment);
        }
      },

      onRightHeld() {
        setValue(value + increment);
      },
    }),
    [increment, setValue, value]
  );

  const dragCallbacks = useMemo<DragMethods<HTMLElement>>(() => {
    function valueFromX(dx: number): number {
      let newValue = dragValue;
      if (logScale) {
        newValue = 2 ** (Math.log2(newValue) + dx * Math.log2(max - min));
      } else {
        newValue += dx * (max - min);
      }
      return newValue;
    }

    return {
      onDragStart(ds) {
        setDragOrigin(ds.x);
        setDragValue(value);
      },

      onDragMove(ds) {
        if (element.current) {
          setValue(valueFromX((ds.x - dragOrigin) / element.current.offsetWidth));
        }
      },
    };
  }, [dragOrigin, dragValue, logScale, max, min, setValue, value]);

  const dragMethods = usePointerDrag(dragCallbacks);

  const onDoubleClick = useCallback(
    () => {
      if (!enumVals && inputEl.current) {
        inputEl.current.value = value.toString();
        inputEl.current.select();
        setTextActive(true);
        window.setTimeout(() => {
          inputEl.current?.focus();
        }, 5);
      }
    },
    [enumVals, value]
  );

  const onBlurInput = useCallback(
    () => {
      if (inputEl.current) {
        setTextActive(false);
        const newValue = parseFloat(inputEl.current.value);
        if (!isNaN(newValue)) {
          setValue(newValue);
        }
      }
    },
    [setValue]
  );

  const onInputKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.keyCode === 13 && inputEl.current) {
        e.preventDefault();
        const newValue = parseFloat(inputEl.current.value);
        if (!isNaN(newValue)) {
          setValue(newValue);
          setTextActive(false);
        }
      } else if (e.keyCode === 27) {
        e.preventDefault();
        setTextActive(false);
      }
    },
    [setValue]
  );

  const percent = enumVals ? 100 : ((value - min) * 100) / (max - min);
  const style = {
    backgroundImage: `linear-gradient(to right, #bbc 0, #bbc ${percent}%, #aab ${percent}%, #aab 100% )`,
  };
  const displayVal = enumVals ? enumVals[value] : value;

  return (
    <ComboSliderElt
      className={classNames('combo-slider', className, { textActive })}
      ref={element}
      style={style}
    >
      <ComboSliderArrowButtonLeft
        className="left"
        onChange={buttonMethods.onLeftChange}
        onHeld={buttonMethods.onLeftHeld}
      />
      <ComboSliderContainer {...dragMethods} className="center" onDoubleClick={onDoubleClick} >
        <ComboSliderName className="name">{name}: </ComboSliderName>
        <span className="value">{displayVal}</span>
        <ComboSliderInput
          type="text"
          autoFocus={true}
          onKeyDown={onInputKey}
          onBlur={onBlurInput}
          ref={inputEl}
        />
      </ComboSliderContainer>
      <ComboSliderArrowButtonRight
        className="right"
        onChange={buttonMethods.onRightChange}
        onHeld={buttonMethods.onRightHeld}
      />
    </ComboSliderElt>
  );
};
