export class RoundParticipant {
  constructor(
    public readonly id: string,
    public readonly roundId: string,
    public readonly userId: string,
    public readonly tapCount: number,
    public readonly score: number,
    public readonly lastTappedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    roundId: string,
    userId: string
  ): RoundParticipant {
    const now = new Date();
    return new RoundParticipant(id, roundId, userId, 0, 0, null, now, now);
  }

  setTapCount(tapCount: number, score: number): RoundParticipant {
    return new RoundParticipant(
      this.id,
      this.roundId,
      this.userId,
      tapCount,
      score,
      new Date(),
      this.createdAt,
      new Date()
    );
  }
}


