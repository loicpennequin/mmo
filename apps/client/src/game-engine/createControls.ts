import type { Point, Values } from '@mmo/shared';
import type { Camera } from './createCamera';
import mitt from 'mitt';

type ControlEvents = {
  move: Directions;
};
export const KeyboardControls = Object.freeze({
  W: 'KeyW',
  S: 'KeyS',
  A: 'KeyA',
  D: 'KeyD'
});
export type KeyboardControls = Values<typeof KeyboardControls>;

export type PlayerControlsOptions = {
  canvas: HTMLCanvasElement;
  camera: Camera;
  mousePosition: Point;
};

export type Directions = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

type Direction = Values<Directions>;

const keyMap = {
  [KeyboardControls.W]: 'up',
  [KeyboardControls.S]: 'down',
  [KeyboardControls.A]: 'left',
  [KeyboardControls.D]: 'right'
} as const;

type KeyMap = typeof keyMap;

export const createControls = () => {
  const emitter = mitt<ControlEvents>(); //
  const directions = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  useKeydownOnce(e => {
    const direction = keyMap[e.code as keyof KeyMap];
    if (direction) {
      directions[direction] = true;
      emitter.emit('move', directions);
    }
  });

  document.addEventListener('keyup', e => {
    const direction = keyMap[e.code as keyof KeyMap];
    if (direction) {
      directions[direction] = false;
      emitter.emit('move', directions);
    }
  });

  return emitter;
};
