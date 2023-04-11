import { clamp } from './helpers';
import type { Matrix } from './types/utils';

export const rotateMatrix = <T>(
  matrix: Matrix<T>,
  angle: number
): Matrix<T> => {
  if (angle % 90 !== 0) {
    throw new Error(
      `Can only rotate matrix by a multiple of 90, ${angle} given`
    );
  }
  const rotate90 = <T>(m: Matrix<T>) =>
    m[0].map((val, index) => m.map(row => row[index]).reverse());

  let result = matrix;

  for (let i = 0; i < angle / 90; i++) {
    result = rotate90(result);
  }

  return result;
};

export const mapRange = (
  num: number,
  inRange: [number, number],
  outRange: [number, number]
) => {
  const mapped: number =
    ((num - inRange[0]) * (outRange[1] - outRange[0])) /
      (inRange[1] - inRange[0]) +
    outRange[0];

  return clamp(mapped, outRange[0], outRange[1]);
};

export const deg2Rad = (degrees: number) => {
  return degrees * (Math.PI / 180);
};

export const rad2Deg = (radians: number) => {
  return (180 * radians) / Math.PI;
};

export const smootherStep = (x: number) =>
  6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;

export const smootherlerp = (num: number, [min, max]: [number, number]) => {
  return min + smootherStep(num) * (max - min);
};

export const lerp = (num: number, [min, max]: [number, number]) => {
  return min + num * (max - min);
};
