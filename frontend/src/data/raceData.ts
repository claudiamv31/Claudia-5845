export const snailRoster = [
  { id: 'turbo', name: 'Turbo' },
  { id: 'shelly', name: 'Shelly' },
  { id: 'rocket', name: 'Rocket' },
  { id: 'dash', name: 'Dash' },
  { id: 'peanut', name: 'Peanut' },
  { id: 'flash', name: 'Flash' },
] as const;

export type SnailId = (typeof snailRoster)[number]['id'];

export const simulatedRaces = [
  { id: 'race-01', winnerId: 'turbo' },
  { id: 'race-02', winnerId: 'shelly' },
  { id: 'race-03', winnerId: 'rocket' },
  { id: 'race-04', winnerId: 'turbo' },
  { id: 'race-05', winnerId: 'peanut' },
  { id: 'race-06', winnerId: 'flash' },
] as const satisfies readonly { id: string; winnerId: SnailId }[];

export type RaceId = (typeof simulatedRaces)[number]['id'];
export type SimulatedRace = (typeof simulatedRaces)[number];

export interface SnailWinTotal {
  snailId: SnailId;
  wins: number;
}

export const snailWinTotals: readonly SnailWinTotal[] = snailRoster.map(
  (snail) => ({
    snailId: snail.id,
    wins: simulatedRaces.filter((race) => race.winnerId === snail.id).length,
  }),
);

export interface BettingSummary {
  won: number;
  lost: number;
}

export const bettingSummary = {
  won: 14,
  lost: 6,
} as const satisfies BettingSummary;
