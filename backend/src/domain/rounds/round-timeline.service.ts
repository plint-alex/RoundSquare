export interface RoundTimeline {
  cooldownStartAt: Date;
  startAt: Date;
  endAt: Date;
}

/**
 * Computes round timeline based on creation time and durations.
 * All times are in UTC.
 *
 * @param createdAt - When the round was created
 * @param cooldownDurationMs - Cooldown duration in milliseconds
 * @param roundDurationMs - Round duration in milliseconds
 * @returns Timeline with cooldownStartAt, startAt, and endAt
 */
export function computeTimeline(
  createdAt: Date,
  cooldownDurationMs: number,
  roundDurationMs: number
): RoundTimeline {
  const cooldownStartAt = new Date(createdAt);
  const startAt = new Date(createdAt.getTime() + cooldownDurationMs);
  const endAt = new Date(startAt.getTime() + roundDurationMs);

  return {
    cooldownStartAt,
    startAt,
    endAt,
  };
}


