import React, { FC, useContext, useLayoutEffect, useRef } from 'react';
import classNames from 'classnames';
import { GraphNode } from '../graph';
import { RendererContext } from './Renderer';

interface Props {
  node: GraphNode | null;
  width: number;
  height: number;
  tiling?: number;
  className?: string;
}

export const RenderedImage: FC<Props> = ({
  node,
  width,
  height,
  tiling = 1,
  className,
  ...props
}) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useContext(RendererContext);

  useLayoutEffect(() => {
    if (node) {
      const updateCanvas = (rebuildShader?: boolean) => {
        const context = canvas.current?.getContext('2d');
        if (node.deleted) {
          node.destroy(renderer);
        } else if (context) {
          renderer.setTiling(tiling);
          renderer.render(node, width, height, context, rebuildShader);
        }
      };

      updateCanvas(true);

      const onNodeUpdate = () => updateCanvas(false);
      node.watch(onNodeUpdate);
      return () => node.unwatch(onNodeUpdate);
    }
  }, [node, width, height, tiling, renderer]);

  return (
    <canvas
      {...props}
      className={classNames("rendered-image", className)}
      style={{ width: `${width}px`, height: `${height}px` }}
      width={width}
      height={height}
      ref={canvas}
    />
  );
};
