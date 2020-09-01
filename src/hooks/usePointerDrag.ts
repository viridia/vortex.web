import { useEffect, useRef, useState } from 'react';
import { useLatest } from './useLatest';

export interface DragOptions {
  /** Return client coordinates instead of element-relative coordinates. */
  clientCoords?: boolean;
}

export interface DragState<T extends HTMLElement = HTMLElement> {
  /** Whether a drag is in progress. */
  dragging: boolean;
  /** X-coordinate of the pointer relative to the element bounds. */
  x: number;
  /** Y-coordinate of the pointer relative to the element bounds. */
  y: number;
  /** Client rect of element. */
  rect: DOMRect;
  /** Whether the pointer has dragged outside the bounds of the element. */
  inBounds: boolean;
  /** The target element that was clicked on to initiate the drag. */
  target: T;
}

type DragMethod<T extends HTMLElement, R> = (
  dragState: DragState<T>,
  e: PointerEvent
) => R;

export interface DragMethods<T extends HTMLElement = HTMLElement> {
  onDragStart?: DragMethod<T, boolean | void>;
  onDragEnd?: DragMethod<T, void>;
  onDragMove?: DragMethod<T, void>;
  onDragEnter?: DragMethod<T, void>;
  onDragLeave?: DragMethod<T, void>;
}

/** Hook that manages dragging on a control using pointer events.

    This is not 'drag and drop', but merely dragging within a single widget.
 */
export const usePointerDrag = <T extends HTMLElement = HTMLElement>(
  callbacks: DragMethods<T>,
  targetElt?: T | null,
  options: DragOptions = {}
): ((ref: T | null) => void) => {
  const [ref, setRef] = useState<T | null>(null);
  const pointerId = useRef<number>(-1);
  // Mutable reference to latest callbacks. We don't want the effects to re-run when
  // callbacks change, but we do want them to use the latest callbacks.
  const cbs = useLatest(callbacks);

  // If a target element was provided, then use it instead of depending on setRef.
  useEffect(() => {
    if (targetElt !== undefined) {
      setRef(targetElt);
    }
  }, [targetElt]);

  // Listen for pointer down events.
  useEffect(() => {
    // Note that changing ref effectively cancels the drag.
    if (ref) {
      // This should persist as long as `ref` doesn't change.
      const dragState: DragState<T> = {
        dragging: false,
        x: 0,
        y: 0,
        rect: new DOMRect(),
        inBounds: false,
        target: ref,
      };

      const updateDragPosition = (e: PointerEvent) => {
        dragState.rect = ref.getBoundingClientRect();
        if (options.clientCoords) {
          dragState.x = e.clientX;
          dragState.y = e.clientY;
        } else {
          dragState.x = e.clientX - dragState.rect.left;
          dragState.y = e.clientY - dragState.rect.top;
        }
      };

      const onPointerUp = (e: PointerEvent) => {
        if (e.pointerId === pointerId.current) {
          stopDragging();
          ref.releasePointerCapture(pointerId.current);
          pointerId.current = -1;
          cbs.current.onDragEnd && cbs.current.onDragEnd(dragState, e);
        }
      };

      const onPointerEnter = (e: PointerEvent) => {
        if (e.pointerId === pointerId.current) {
          dragState.inBounds = true;
          updateDragPosition(e);
          cbs.current.onDragEnter && cbs.current.onDragEnter(dragState, e);
        }
      };

      const onPointerLeave = (e: PointerEvent) => {
        if (e.pointerId === pointerId.current) {
          dragState.inBounds = false;
          updateDragPosition(e);
          cbs.current.onDragLeave && cbs.current.onDragLeave(dragState, e);
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        if (e.pointerId === pointerId.current) {
          updateDragPosition(e);
          cbs.current.onDragMove && cbs.current.onDragMove(dragState, e);
        }
      };

      const onPointerDown = (e: PointerEvent) => {
        e.stopPropagation();
        dragState.target = e.target as T;
        dragState.inBounds = true;
        updateDragPosition(e);
        if (cbs.current.onDragStart) {
          // Cancel the drag if onDragStart returns false (not undefined)
          if (cbs.current.onDragStart(dragState, e) === false) {
            return;
          }
        }
        pointerId.current = e.pointerId;
        ref.setPointerCapture(e.pointerId);
        startDragging();
      };

      const startDragging = () => {
        dragState.dragging = true;
        ref.addEventListener('pointerup', onPointerUp);
        ref.addEventListener('pointerenter', onPointerEnter);
        ref.addEventListener('pointerleave', onPointerLeave);
        ref.addEventListener('pointermove', onPointerMove);
      };

      const stopDragging = () => {
        dragState.dragging = false;
        ref.removeEventListener('pointerup', onPointerUp);
        ref.removeEventListener('pointerenter', onPointerEnter);
        ref.removeEventListener('pointerleave', onPointerLeave);
        ref.removeEventListener('pointermove', onPointerMove);
      };

      ref.addEventListener('pointerdown', onPointerDown);
      return () => {
        stopDragging();
        ref.removeEventListener('pointerdown', onPointerDown);
        if (pointerId.current !== -1) {
          ref.releasePointerCapture(pointerId.current);
        }
      };
    }
  }, [ref, cbs, options.clientCoords]);

  return setRef;
};
