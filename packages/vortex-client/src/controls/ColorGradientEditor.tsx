import React, { FC, useCallback, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { ColorGradient, ColorStop, RGBAColor, formatRGBAColor } from '../render/colors';
import { ColorPicker } from './ColorPicker';
import { ColorStopDragger } from './ColorStopDragger';
import { ComboSlider } from './ComboSlider';
import { DragState, usePointerDrag } from '../hooks/usePointerDrag';
import { colors } from '../styles';
import { observer } from 'mobx-react';
import { runInAction } from 'mobx';
import { useShortcuts } from '../hooks/useShortcuts';

const ColorGradientEditorElt = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  align-items: stretch;
`;

const ColorStops = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin: 4px 0 8px 0;
`;

const ColorStopsCaption = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${colors.controlBorder};
  border-top-right-radius: 6px;
  border-top-left-radius: 6px;
  background-color: ${colors.comboBg};
  font-size: 14px;
  height: 24px;
`;

const ColorStopsGradient = styled.div`
  position: relative;
  height: 32px;
  border: 1px solid ${colors.controlBorder};
  border-top: none;
`;

interface Props {
  caption: string;
  value: ColorGradient;
  onChange: () => void;
}

export const ColorGradientEditor: FC<Props> = observer(({ caption, value: gradient, onChange }) => {
  const colorPicker = useRef<ColorPicker>(null);
  const [gradientElt, setGradientElt] = useState<HTMLDivElement | null>(null);
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState(-1);

  const getTargetStopIndex = useCallback(
    (elt: HTMLElement): number => {
      for (let node = elt; node && node !== gradientElt; node = node.parentElement as HTMLElement) {
        if (node.dataset.stopindex) {
          return Number(node.dataset.stopindex);
        }
      }
      return -1;
    },
    [gradientElt]
  );

  const callbacks = useMemo(() => {
    return {
      onDragStart(e: DragState) {
        // Test if we clicked on an existing stop; if so then select it and start dragging.
        const index = getTargetStopIndex(e.target!);
        if (index >= 0) {
          const color = Array.from(gradient[index].value) as RGBAColor;
          setSelected(index);
          colorPicker.current?.setRGBA(color, true);
          // First and last color stops cannot be dragged.
          return index > 0 && index < gradient.length - 1;
        }

        const position = Math.min(1.0, Math.max(0, e.x / e.rect.width));
        const stop = getColorAt(gradient, position);
        setSelected(-1);
        setPosition(position);
        colorPicker.current?.setRGBA(stop.value, true);
        return false;
      },

      onDragMove(e: DragState) {
        if (selected > 0) {
          const fraction = Math.min(1.0, Math.max(0, e.x / e.rect.width));
          const min = selected > 0 ? gradient[selected - 1].position : 0;
          const max = selected < gradient.length - 1 ? gradient[selected + 1].position : 1;
          runInAction(() => {
            gradient[selected].position = Math.max(min, Math.min(max, fraction));
          });
          onChange();
        }
      },
    };
  }, [getTargetStopIndex, gradient, onChange, selected]);

  const pointerMethods = usePointerDrag<HTMLDivElement>(callbacks);

  const onDelete = useCallback(() => {
    if (selected > 0 && selected < gradient.length - 1) {
      runInAction(() => {
        gradient.splice(selected, 1);
        setSelected(-1);
      });
    }
  }, [gradient, selected]);

  useShortcuts(
    {
      del: onDelete,
      backspace: onDelete,
    },
    { scope: 'gradient', scopeActive: selected >= 0 }
  );

  const onDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();

      // Needed because double-click returns the wrong target after pointer down.
      const clickElement = document.elementFromPoint(e.clientX, e.clientY);

      // Test if we clicked on an existing stop; if so then delete it.
      const index = getTargetStopIndex(clickElement as HTMLElement);
      if (index >= 0) {
        if (index > 0 && index < gradient.length - 1) {
          runInAction(() => {
            gradient.splice(index, 1);
            setSelected(-1);
          });
        }
        return;
      }

      // Our shaders only support 32 stops
      if (gradientElt && gradient.length < 32) {
        const rect = gradientElt.getBoundingClientRect();
        const fraction = Math.min(1.0, Math.max(0, (e.clientX - rect.left) / rect.width));
        const nextIndex = findEnclosingStops(gradient, fraction)[1];
        const newStop = getColorAt(gradient, fraction);
        runInAction(() => {
          gradient.splice(nextIndex, 0, newStop);
        });
        const color = Array.from(gradient[nextIndex].value) as RGBAColor;
        setSelected(nextIndex);
        colorPicker.current?.setRGBA(color, true);
        onChange();
      }
    },
    [getTargetStopIndex, gradient, gradientElt, onChange]
  );

  const onChangeColor = useCallback(
    (color: RGBAColor) => {
      if (selected >= 0) {
        runInAction(() => {
          gradient[selected].value = color;
        });
        onChange();
      }
    },
    [gradient, onChange, selected]
  );

  const onChangePosition = useCallback(
    (value: number) => {
      if (selected >= 0) {
        setPosition(value);
        runInAction(() => {
          gradient[selected].position = Math.max(0, Math.min(1, value));
        });
        onChange();
      }
    },
    [gradient, onChange, selected]
  );

  const gradientFill = `linear-gradient(to right, ${gradient
    .map(({ value, position }) => `${formatRGBAColor(value)} ${Math.round(position * 1000) / 10}%`)
    .join(', ')})`;

  return (
    <ColorGradientEditorElt className="color-gradient-editor">
      <ColorStops className="color-stops property-group">
        <ColorStopsCaption className="caption">{caption}</ColorStopsCaption>
        <ColorStopsGradient
          {...pointerMethods}
          className="gradient"
          style={{ backgroundImage: gradientFill }}
          ref={setGradientElt}
          onDoubleClick={onDoubleClick}
        >
          {gradient.map((cs, i) => (
            <ColorStopDragger
              color={cs.value}
              value={cs.position}
              key={i}
              index={i}
              selected={i === selected}
            />
          ))}
        </ColorStopsGradient>
        <ComboSlider
          name="Position"
          value={position}
          max={1}
          min={0}
          increment={1 / 256.0}
          precision={2}
          onChange={onChangePosition}
        />
      </ColorStops>
      <ColorPicker
        ref={colorPicker}
        onChange={onChangeColor}
        disabled={selected < 0}
        alpha={true}
      />
    </ColorGradientEditorElt>
  );
});

function getColorAt(gradient: ColorGradient, position: number): ColorStop {
  const [prevIndex, nextIndex] = findEnclosingStops(gradient, position);
  const prev = gradient[prevIndex];
  const next = gradient[nextIndex];
  const t =
    next.position > prev.position
      ? (position - prev.position) / (next.position - prev.position)
      : 0;
  return {
    position: Math.max(prev.position, Math.min(next.position, position)),
    value: [
      prev.value[0] + t * (next.value[0] - prev.value[0]),
      prev.value[1] + t * (next.value[1] - prev.value[1]),
      prev.value[2] + t * (next.value[2] - prev.value[2]),
      prev.value[3] + t * (next.value[3] - prev.value[3]),
    ],
  };
}

/** Given a position value in the range [0, 1], returns the index of the color stops
    before and after that position. If the input value is before the first stop then both
    numbers will be zero; if the input value is after the last stop then both numbers will
    be the index of the last stop.

    The idea is that these would be used to interpolate between the two stops to get the
    color at that point in the gradient. In the case where the position is before the first
    or after the last stop, the color is constant so the interpolation degenerates into a
    constant color.
*/
function findEnclosingStops(gradient: ColorGradient, position: number): [number, number] {
  const index = gradient.findIndex(cs => cs.position > position);
  let next: number;
  let prev: number;
  if (index < 0) {
    next = prev = gradient.length - 1;
  } else {
    next = index;
    prev = Math.max(0, index - 1);
  }
  return [prev, next];
}
