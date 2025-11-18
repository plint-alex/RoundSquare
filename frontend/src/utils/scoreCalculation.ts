/**
 * Calculate total score from tap count
 * Every 11th tap gives 10 points, otherwise 1 point
 * @param tapCount - Total number of taps
 * @returns Total score
 */
export function calculateScore(tapCount: number): number {
  let score = 0
  for (let i = 1; i <= tapCount; i++) {
    score += i % 11 === 0 ? 10 : 1
  }
  return score
}

