import { randomInt, type SpatialHashGrid } from '@mmo/shared';
import type { GameMap } from '../mapgen';
import { GamePlayer } from '../game';

type CreatePlayerOptions = {
  map: GameMap;
  grid: SpatialHashGrid;
};

const findValidSpawnPosition = (map: GameMap) => {
  let spawnPosition = {
    x: randomInt(map.width),
    y: randomInt(map.height)
  };
  let cell = map.getCellAt(spawnPosition);

  while (cell.height === 0) {
    spawnPosition = {
      x: randomInt(map.width),
      y: randomInt(map.height)
    };
    cell = map.getCellAt(spawnPosition);
  }

  return spawnPosition;
};

export const createPlayer = (
  id: string,
  { map, grid }: CreatePlayerOptions
): GamePlayer => {
  return {
    gridItem: grid.add({
      ...findValidSpawnPosition(map),
      w: 1,
      h: 1
    }),
    id,
    character: 'adventurer',
    directions: { up: false, down: false, left: false, right: false }
  };
};
