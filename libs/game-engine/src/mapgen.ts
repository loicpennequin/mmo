import { zip } from 'lodash-es';
import {
  type MapCell,
  type Point,
  clamp,
  dist,
  Circle,
  Boundaries,
  subVector,
  addVector,
  fastDistCheck
} from '@mmo/shared';
import { makeNoise2D } from 'open-simplex-noise';
import { CHUNK_SIZE, HEIGHT, MAP_SEED, WIDTH } from './constants';
import { generateNoiseChunk, sampleNoise } from './utils/noise';
import { System } from 'detect-collisions';
import { isCellWalkable } from './utils/map';

const HEIGHTS = {
  SEA_LEVEL: 0,
  BEACH: 1,
  GROUND: 2,
  ROCKS: 3
} as const;

const HEIGHT_DISTRIBUTION_MAP = {
  0: HEIGHTS.SEA_LEVEL,
  5: HEIGHTS.SEA_LEVEL,
  10: HEIGHTS.SEA_LEVEL,
  15: HEIGHTS.SEA_LEVEL,
  20: HEIGHTS.SEA_LEVEL,
  25: HEIGHTS.SEA_LEVEL,
  30: HEIGHTS.SEA_LEVEL,
  35: HEIGHTS.SEA_LEVEL,
  40: HEIGHTS.SEA_LEVEL,
  45: HEIGHTS.BEACH,
  50: HEIGHTS.BEACH,
  55: HEIGHTS.GROUND,
  60: HEIGHTS.GROUND,
  65: HEIGHTS.GROUND,
  70: HEIGHTS.GROUND,
  75: HEIGHTS.GROUND,
  80: HEIGHTS.GROUND,
  85: HEIGHTS.GROUND,
  90: HEIGHTS.GROUND,
  95: HEIGHTS.GROUND,
  100: HEIGHTS.GROUND
} as const;

const TEMPERATURES = {
  COLD: 0,
  WARM: 1,
  HOT: 2
} as const;

const TEMPERATURE_DISTRIBUTION_MAP = {
  0: TEMPERATURES.COLD,
  5: TEMPERATURES.COLD,
  10: TEMPERATURES.COLD,
  15: TEMPERATURES.COLD,
  20: TEMPERATURES.COLD,
  25: TEMPERATURES.WARM,
  30: TEMPERATURES.WARM,
  35: TEMPERATURES.WARM,
  40: TEMPERATURES.WARM,
  45: TEMPERATURES.WARM,
  50: TEMPERATURES.WARM,
  55: TEMPERATURES.WARM,
  60: TEMPERATURES.WARM,
  65: TEMPERATURES.WARM,
  70: TEMPERATURES.WARM,
  75: TEMPERATURES.HOT,
  80: TEMPERATURES.HOT,
  85: TEMPERATURES.HOT,
  90: TEMPERATURES.HOT,
  95: TEMPERATURES.HOT,
  100: TEMPERATURES.HOT
} as const;

export const createMap = ({ world }: { world: System }) => {
  const seed = MAP_SEED;

  const chunks = new Map<string, MapCell[]>();
  const getChunkKey = ({ x, y }: Point) => `${x}:${y}`;

  const generateChunk = (startsAt: Point) => {
    const heightMap = generateNoiseChunk({
      startsAt,
      noise: makeNoise2D(seed),
      frequency: 0.08,
      octaves: 4,
      mapFn: n => sampleNoise(n, HEIGHT_DISTRIBUTION_MAP),
      fix: true
    });

    const temperatureMap = generateNoiseChunk({
      startsAt,
      noise: makeNoise2D(seed + 1),
      frequency: 0.02,
      octaves: 1,
      mapFn: n => sampleNoise(n, TEMPERATURE_DISTRIBUTION_MAP)
    });

    return zip(heightMap, temperatureMap).map(
      ([height, temperature], index) => ({
        height: height as number,
        temperature: temperature as number,
        position: {
          x: startsAt.x + (index % CHUNK_SIZE),
          y: startsAt.y + Math.floor(index / CHUNK_SIZE)
        }
      })
    );
  };

  const getOrCreateChunk = (startsAt: Point) => {
    const key = getChunkKey(startsAt);

    if (!chunks.has(key)) {
      const chunk = generateChunk(startsAt);
      chunk.forEach(cell => {
        if (!isCellWalkable(cell)) {
          world.createBox(cell.position, 1, 1, { isStatic: true });
        }
      });
      chunks.set(key, generateChunk(startsAt));
    }

    return chunks.get(key)!;
  };

  const getCellAt = ({ x, y }: Point) => {
    x = Math.round(x);
    y = Math.round(y);
    const chunkOrigin = {
      x: Math.floor(x / CHUNK_SIZE) * CHUNK_SIZE,
      y: Math.floor(y / CHUNK_SIZE) * CHUNK_SIZE
    };

    const cells = getOrCreateChunk(chunkOrigin);

    return cells[(y - chunkOrigin.y) * CHUNK_SIZE + x - chunkOrigin.x];
  };

  const getCellsInside = ({ min, max }: Boundaries<Point>, fov?: Circle) => {
    const cells: MapCell[] = [];
    for (let cellY = min.y; cellY <= max.y; cellY++) {
      for (let cellX = min.x; cellX <= max.x; cellX++) {
        const isVisible =
          !fov ||
          fastDistCheck(
            { x: Math.round(fov.x), y: Math.round(fov.y) },
            { x: cellX, y: cellY },
            fov.r
          );

        if (isVisible) {
          cells.push(getCellAt({ x: cellX, y: cellY }));
        }
      }
    }
    return cells;
  };

  const clampToMapBounds = ({ x, y }: Point) => ({
    x: clamp(Math.round(x), 0, WIDTH - 1),
    y: clamp(Math.round(y), 0, HEIGHT - 1)
  });

  const getFieldOfView = ({ x, y }: Point, fov: number) => {
    const min = clampToMapBounds(subVector({ x, y }, fov));
    const max = clampToMapBounds(addVector({ x, y }, fov));

    return getCellsInside({ min, max }, { x, y, r: fov });
  };

  return {
    width: WIDTH,
    height: HEIGHT,
    getCellAt: (pt: Point) => getCellAt(pt),
    getWithinBounds: (bounds: Boundaries<Point>) => {
      const min = clampToMapBounds(bounds.min);
      const max = clampToMapBounds(bounds.max);

      return getCellsInside({ min, max });
    },
    getFieldOfView: (pt: Point, fov: number) => getFieldOfView(pt, fov)
  };
};

export type GameMap = ReturnType<typeof createMap>;
