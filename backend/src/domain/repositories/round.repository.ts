import { Round } from '../rounds/round.entity.js';
import { RoundStatus } from '../rounds/round-status.enum.js';

export interface RoundRepository {
  findById(id: string): Promise<Round | null>;
  findAll(): Promise<Round[]>;
  findByStatus(status: RoundStatus): Promise<Round[]>;
  findActive(): Promise<Round[]>;
  findSchedulable(): Promise<Round[]>; // Finds rounds that may need status updates
  create(round: Round): Promise<Round>;
  update(round: Round): Promise<Round>;
  updateStatus(id: string, status: RoundStatus): Promise<Round>; // Atomic status update
  incrementTotalPoints(roundId: string, points: number): Promise<void>; // Atomic increment of total points
}

