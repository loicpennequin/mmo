import * as PIXI from 'pixi.js';
import { CELL_SIZE } from './constants';
import type { User } from '.';

const playerCreationPromises = new Map<string, Promise<PIXI.Container>>();

export const playerSpritesById: Record<string, PIXI.Container> = {};

const addEntity = async (container: PIXI.Container, player: User) => {
  const entityContainer = new PIXI.Container();
  playerSpritesById[player.id] = container;

  const g = new PIXI.Graphics();
  g.lineStyle(0);
  g.beginFill(0xde3249, 1);
  g.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE * 0.33);
  g.endFill();
  // we offser the position by half a cell because cells are anchored on the center which naturally offsets them as well
  g.position.set(-(CELL_SIZE / 2), -(CELL_SIZE / 2));

  entityContainer.addChild(g);
  container.addChild(container);

  return entityContainer;
};

export const createEntity = async (container: PIXI.Container, player: User) => {
  if (!playerCreationPromises.has(player.id)) {
    playerCreationPromises.set(player.id, addEntity(container, player));
  }

  return playerCreationPromises.get(player.id)!;
};
