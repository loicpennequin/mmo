import { EventEmitter } from 'events';
import type TypedEmitter from 'typed-emitter';
import type { Nullable } from '@mmo/shared';
import { MAX_OBSTACLES, TICK_RATE } from './constants';
import { createEventQueue, type GameEvent } from './factories/eventQueue';
import { createSystems } from './factories/systems';
import {
  GameStateSnapshot,
  createContext,
  getSnapshot
} from './factories/context';
import { createObstacle } from './factories/obstacle';

export type GameEvents = {
  update: (state: GameStateSnapshot) => void | Promise<void>;
};

export const createGame = () => {
  const context = createContext();
  const emitter = new EventEmitter() as TypedEmitter<GameEvents>;
  const queue = createEventQueue(context);
  const systems = createSystems(context);

  for (let i = 0; i < MAX_OBSTACLES; i++) {
    context.entities.add(createObstacle(context));
  }

  let prevTick = 0;
  let interval: Nullable<ReturnType<typeof setInterval>>;

  const engine = {
    get meta() {
      return {
        width: context.map.width,
        height: context.map.height
      };
    },

    get isRunning() {
      return !!interval;
    },

    start() {
      if (engine.isRunning) return;
      prevTick = performance.now();
      const perfBudget = 1000 / TICK_RATE;

      interval = setInterval(() => {
        const now = performance.now();
        queue.process();
        systems.run(now - prevTick);
        emitter.emit('update', getSnapshot(context));

        const elapsed = performance.now() - now;
        if (elapsed > perfBudget) {
          console.log(
            `tick duration over performance budget by ${(
              elapsed - perfBudget
            ).toFixed(1)}ms`
          );
        }
        prevTick = now;
      }, 1000 / TICK_RATE);
    },

    stop() {
      if (!interval) return;
      clearInterval(interval);
      interval = null;
    },

    schedule(event: GameEvent) {
      queue.dispatch(event);
    },

    on: emitter.on.bind(emitter)
  };

  return engine;
};
