export type AffinityLevel = {
  level: number;
  name: string;
  minPoints: number;
};

export type AffinityProgress = {
  level: number;
  levelName: string;
  points: number;
  /** Points where the current level starts. */
  levelMinPoints: number;
  /** Points needed for the next level, or undefined when max level. */
  nextLevelPoints?: number;
  /** Progress within the current level, between 0 and 1 (1 at max level). */
  progress: number;
  isMaxLevel: boolean;
};

export const AFFINITY_LEVELS: AffinityLevel[] = [
  { level: 1, name: 'Stranger', minPoints: 0 },
  { level: 2, name: 'Friend', minPoints: 50 },
  { level: 3, name: 'Close Friend', minPoints: 150 },
  { level: 4, name: 'Companion', minPoints: 400 },
  { level: 5, name: 'Soulmate', minPoints: 1000 },
];

export function getAffinityLevel(points?: number): AffinityLevel {
  const safePoints = Number.isFinite(points) ? Math.max(0, Math.floor(points!)) : 0;
  let current = AFFINITY_LEVELS[0];
  for (const level of AFFINITY_LEVELS) {
    if (safePoints >= level.minPoints) {
      current = level;
    }
  }
  return current;
}

/**
 * Rebuild an affinity update from a base of points. Used for anonymous users,
 * whose accumulated points live locally and not in the backend record.
 */
export function buildAffinityUpdate(
  previousPoints: number,
  pointsEarned: number,
  qualityMultiplier: number,
): {
  pointsEarned: number;
  qualityMultiplier: number;
  previousPoints: number;
  totalPoints: number;
  previousLevel: number;
  level: number;
  levelName: string;
  leveledUp: boolean;
} {
  const safePrevious = Math.max(0, Math.floor(previousPoints || 0));
  const safeEarned = Math.max(0, Math.floor(pointsEarned || 0));
  const totalPoints = safePrevious + safeEarned;
  const previousLevel = getAffinityLevel(safePrevious);
  const level = getAffinityLevel(totalPoints);
  return {
    pointsEarned: safeEarned,
    qualityMultiplier,
    previousPoints: safePrevious,
    totalPoints,
    previousLevel: previousLevel.level,
    level: level.level,
    levelName: level.name,
    leveledUp: level.level > previousLevel.level,
  };
}

export function getAffinityProgress(points?: number): AffinityProgress {
  const safePoints = Number.isFinite(points) ? Math.max(0, Math.floor(points!)) : 0;
  const current = getAffinityLevel(safePoints);
  const next = AFFINITY_LEVELS.find((level) => level.level === current.level + 1);
  const isMaxLevel = !next;
  const progress = next
    ? Math.max(0, Math.min(1, (safePoints - current.minPoints) / (next.minPoints - current.minPoints)))
    : 1;
  return {
    level: current.level,
    levelName: current.name,
    points: safePoints,
    levelMinPoints: current.minPoints,
    ...(next ? { nextLevelPoints: next.minPoints } : {}),
    progress,
    isMaxLevel,
  };
}
