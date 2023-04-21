import {
  MapCell,
  Point,
  addVector,
  clamp,
  dist,
  rectRectCollision,
  setMagnitude,
  subVector
} from '@mmo/shared';
import { GameContext } from '../factories/context';
import { WithGridItem, WithMovement, hasGridItem, hasMovement } from '../types';
import { isObstacle } from '../factories/obstacle';
import { isWalkable } from '../utils/map';

const ENTITY_SEPARATION = 0.5;
type Movable = WithGridItem & WithMovement;
export const createMovementSystem = (ctx: GameContext) => {
  const { entities, map, grid } = ctx;

  const computePosition = (entity: Movable, force: Point, dt: number) =>
    addVector(
      { x: entity.gridItem.x, y: entity.gridItem.y },
      setMagnitude(force, (entity.speed * dt) / 1000)
    );

  const repel = (entity: WithGridItem, force: Point, repellent: Point) => {
    const d = dist(repellent, entity.gridItem);
    if (d < 0 || d > ENTITY_SEPARATION) return force;

    const diff = subVector(entity.gridItem, repellent);
    return addVector(force, setMagnitude(diff, d));
  };

  const handleObstacles = ({
    entity,
    cellAtDesiredPosition,
    force,
    dt
  }: {
    entity: Movable;
    cellAtDesiredPosition: MapCell;
    force: Point;
    dt: number;
  }) => {
    const initialPosition = { x: entity.gridItem.x, y: entity.gridItem.y };

    const verticalOnlyPos = computePosition(entity, { x: 0, y: force.y }, dt);
    let cell = map.getCellAt(verticalOnlyPos);
    if (isWalkable(cell, ctx)) {
      return verticalOnlyPos;
    }

    const horizontalOnlyPos = computePosition(entity, { x: force.x, y: 0 }, dt);
    cell = map.getCellAt(horizontalOnlyPos);
    if (isWalkable(cell, ctx)) {
      return horizontalOnlyPos;
    }

    return initialPosition;
  };

  return (dt: number) => {
    entities.getList().forEach(entity => {
      if (!hasGridItem(entity) || !hasMovement(entity)) return;
      if (entity.velocity.x === 0 && entity.velocity.y === 0) return;

      const force = grid
        .findNearby(
          entity.gridItem,
          { w: 1, h: 1 },
          gridItem =>
            gridItem !== entity.gridItem &&
            rectRectCollision(gridItem, entity.gridItem)
        )
        .reduce(
          (force, gridItem) => repel(entity, force, gridItem),
          entity.velocity
        );

      let newPos = computePosition(entity, force, dt);
      const cell = map.getCellAt(newPos);

      if (!isWalkable(cell, ctx)) {
        newPos = handleObstacles({
          entity,
          force,
          dt,
          cellAtDesiredPosition: cell
        });
      }

      entity.gridItem.x = clamp(newPos.x, 0, map.width - 1);
      entity.gridItem.y = clamp(newPos.y, 0, map.height - 1);
      grid.update(entity.gridItem);
    });
  };
};
