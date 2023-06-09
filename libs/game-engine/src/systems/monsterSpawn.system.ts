import { GameContext } from '../factories/context';
import { createMonster, isMonster } from '../factories/monster';
import { MAX_MONSTERS, MONSTER_SPAWN_THRESHOLD } from '../constants';

export const createMonsterSpawnSystem = (ctx: GameContext) => {
  let spawhProgress = 0;

  return (dt: number) => {
    if (!ctx.featureFlags.monsterSpawning) return;

    const count = ctx.entities.getList().filter(isMonster).length;
    if (count >= MAX_MONSTERS) return;
    spawhProgress += dt;
    if (spawhProgress < MONSTER_SPAWN_THRESHOLD) return;

    const monster = createMonster(ctx);

    ctx.entities.add(monster);
    spawhProgress = spawhProgress % MONSTER_SPAWN_THRESHOLD;
  };
};
