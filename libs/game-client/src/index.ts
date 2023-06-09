import type {
  AsyncReturnType,
  GameMeta,
  GameStateSnapshotDto,
  MapCell,
  Entity
} from '@mmo/shared';
import * as PIXI from 'pixi.js';
import { createMap } from './createMap';
import { enablePIXIDevtools } from './utils';
import { createCamera } from './createCamera';
import { Stage } from '@pixi/layers';
import type { Socket } from 'socket.io-client';
import { Directions, createControls } from './createControls';
import { createEntityManager } from './createEntityManager';
import { loadTilesets } from './caches/tileset';
import { createMiniMap } from './createMinimap';
import { loadCharactersBundle, loadObstaclesBundle } from './caches/sprites';
import mitt from 'mitt';

PIXI.Container.defaultSortableChildren = true;
PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

type GameEvents = {
  move: Directions;
};

export type GameState = {
  entities: Entity[];
  entitiesById: Record<string, Entity>;
  timestamp: number;
  fieldOfView: MapCell[];
};

const createGameState = (): GameState => {
  return {
    entities: [],
    entitiesById: {},
    fieldOfView: [],
    timestamp: performance.now()
  };
};

export type CreateGameClientOptions = {
  container: HTMLElement;
  meta: GameMeta;
};

export const createGameClient = async ({
  container,
  meta
}: CreateGameClientOptions) => {
  await Promise.all([
    loadTilesets(),
    loadCharactersBundle(),
    loadObstaclesBundle()
  ]);

  const { width, height } = container.getBoundingClientRect();

  const app = new PIXI.Application({
    width,
    height,
    autoDensity: true,
    antialias: false,
    backgroundAlpha: 0,
    resizeTo: container
  });
  enablePIXIDevtools(app);
  app.stage = new Stage();

  const camera = createCamera({ app, meta });
  const map = await createMap({ app, camera, meta });
  const entityManager = createEntityManager({ app, camera, meta });
  const controls = createControls();
  const minimap = createMiniMap({ app, meta });
  const emitter = mitt<GameEvents>();

  controls.on('move', directions => {
    emitter.emit('move', directions);
  });
  app.stage.addChild(camera.container);

  let state = createGameState();

  return {
    canvas: app.view,
    updateState(newState: GameStateSnapshotDto) {
      const prevState = state;
      state = {
        entities: newState.entities,
        entitiesById: Object.fromEntries(newState.entities.map(p => [p.id, p])),
        fieldOfView: newState.fieldOfView,
        timestamp: performance.now()
      };

      camera.onStateUpdate(state);
      entityManager.onStateUpdate(state, prevState);
      map.onStateUpdate(state);
      minimap.onStateUpdate(state);
    },
    on: emitter.on,
    cleanup() {
      camera.cleanup();
      map.cleanup();
      app.destroy();
    }
  };
};

export type GameClient = AsyncReturnType<typeof createGameClient>;
