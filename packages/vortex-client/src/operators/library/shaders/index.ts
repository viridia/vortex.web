import blend from './blend.glsl';
import blur from './blur.glsl';
import bricks from './bricks.glsl';
import cellular from './cellular.glsl';
import cellularHex from './cellular_hex.glsl';
import colorAdjust from './color-adjust.glsl';
import crossfade from './crossfade.glsl';
import gradient from './gradient.glsl';
import gradientColor from './gradient-color.glsl';
import hexgrid from './hexgrid.glsl';
import hsv from './hsv.glsl';
import illuminate from './illuminate.glsl';
import mask from './mask.glsl';
import modulus from './modulus.glsl';
import periodicNoise from './periodic-noise.glsl';
import periodicNoise2 from './periodic-noise2.glsl';
import permute from './permute.glsl';
import pnoise from './pnoise.glsl';
import pworley from './pworley.glsl';
import steppers from './steppers.glsl';
import triangles from './triangles.glsl';
import waves from './waves.glsl';

export const byName: { [name: string]: string } = {
  blend,
  blur,
  bricks,
  cellular,
  cellular_hex: cellularHex,
  'color-adjust': colorAdjust,
  crossfade,
  'gradient-color': gradientColor,
  gradient,
  hexgrid,
  hsv,
  illuminate,
  mask,
  modulus,
  'periodic-noise': periodicNoise,
  'periodic-noise2': periodicNoise2,
  permute,
  pnoise,
  pworley,
  steppers,
  triangles,
  waves,
};
