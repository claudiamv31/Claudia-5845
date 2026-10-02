import { describe, expect, it } from 'vitest';
import {
  bettingSummary,
  simulatedRaces,
  snailRoster,
  snailWinTotals,
} from './raceData';

describe('simulated race data', () => {
  it('defines six coherent races for the six-snail roster', () => {
    expect(snailRoster.map(({ name }) => name)).toEqual([
      'Turbo',
      'Shelly',
      'Rocket',
      'Dash',
      'Peanut',
      'Flash',
    ]);
    expect(simulatedRaces).toHaveLength(6);
    const raceIds = simulatedRaces.map(({ id }) => id);
    expect(new Set(raceIds).size).toBe(6);
    expect(raceIds.every((id) => id.length > 0)).toBe(true);
    expect(
      simulatedRaces.every((race) =>
        snailRoster.some((snail) => snail.id === race.winnerId),
      ),
    ).toBe(true);
    expect(snailWinTotals).toEqual([
      { snailId: 'turbo', wins: 2 },
      { snailId: 'shelly', wins: 1 },
      { snailId: 'rocket', wins: 1 },
      { snailId: 'dash', wins: 0 },
      { snailId: 'peanut', wins: 1 },
      { snailId: 'flash', wins: 1 },
    ]);
  });

  it('provides stable won and lost betting totals', () => {
    expect(bettingSummary).toEqual({ won: 14, lost: 6 });
  });
});
