import { RoundParticipant } from '../rounds/round-participant.entity.js';

export interface RoundParticipantRepository {
  findById(id: string): Promise<RoundParticipant | null>;
  findByRoundId(roundId: string): Promise<RoundParticipant[]>;
  findByUserId(userId: string): Promise<RoundParticipant[]>;
  findByRoundAndUser(roundId: string, userId: string): Promise<RoundParticipant | null>;
  findTopByRoundId(roundId: string, limit: number): Promise<Array<{ participant: RoundParticipant; username: string }>>;
  create(participant: RoundParticipant): Promise<RoundParticipant>;
  update(participant: RoundParticipant): Promise<RoundParticipant>;
  upsertParticipant(
    roundId: string,
    userId: string,
    tapFn: (participant: RoundParticipant | null) => RoundParticipant
  ): Promise<RoundParticipant>;
}

