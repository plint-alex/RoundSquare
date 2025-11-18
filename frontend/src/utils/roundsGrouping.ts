import type { RoundListDto } from '@/api/types'

export interface GroupedRounds {
  active: RoundListDto[]
  cooldown: RoundListDto[]
  completed: RoundListDto[]
}

export function groupRoundsByStatus(rounds: RoundListDto[]): GroupedRounds {
  const grouped: GroupedRounds = {
    active: [],
    cooldown: [],
    completed: [],
  }

  for (const round of rounds) {
    switch (round.status) {
      case 'ACTIVE':
        grouped.active.push(round)
        break
      case 'COOLDOWN':
        grouped.cooldown.push(round)
        break
      case 'COMPLETED':
        grouped.completed.push(round)
        break
    }
  }

  // Sort within groups: most recent first (by startAt)
  const sortByStartAt = (a: RoundListDto, b: RoundListDto) => {
    return new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
  }

  grouped.active.sort(sortByStartAt)
  grouped.cooldown.sort(sortByStartAt)
  grouped.completed.sort(sortByStartAt)

  return grouped
}


