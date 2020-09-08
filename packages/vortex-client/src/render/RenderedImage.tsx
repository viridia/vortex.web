import React, { MutableRefObject, useCallback, useContext, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { GraphNode } from '../graph';
import { RendererContext } from './Renderer';
import { autorun } from 'mobx';

interface Props {
  node: GraphNode | null;
  width: number;
  height: number;
  tiling?: number;
  className?: string;
}

export const RenderedImage = React.forwardRef<HTMLCanvasElement, Props>(({
  node,
  width,
  height,
  tiling = 1,
  className,
  ...props
}, canvasRef) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useContext(RendererContext);
  const ref = useCallback((elt: HTMLCanvasElement) => {
    (canvas as MutableRefObject<HTMLCanvasElement>).current = elt;
    if (typeof canvasRef === 'function') {
      canvasRef(elt);
    } else if (canvasRef) {
      canvasRef.current = elt;
    }
  }, [canvasRef]);

  useEffect(() => {
    return autorun(() => {
      if (node) {
        if (node.deleted) {
          node.dispose(renderer);
        } else {
          const context = canvas.current?.getContext('2d');
          if (context && node.source.length > 0) {
            renderer.setTiling(tiling);
            renderer.render(node, width, height, context);
          }
        }
      }
    });
  }, [node, width, height, tiling, renderer]);

  return (
    <canvas
      {...props}
      className={classNames("rendered-image", className)}
      style={{ width: `${width}px`, height: `${height}px` }}
      width={width}
      height={height}
      ref={ref}
    />
  );
});
