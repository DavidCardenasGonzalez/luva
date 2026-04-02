import type {
  CardProgressStatus,
  UserProgressRecord,
} from '@/features/progress/api/progress-client'

export const CARD_STATUS_LABELS: Record<CardProgressStatus, string> = {
  todo: 'Por aprender',
  learning: 'En aprendizaje',
  learned: 'Aprendida',
}

export const STATUS_ORDER: CardProgressStatus[] = ['todo', 'learning', 'learned']

export function getCardStatus(
  progress: UserProgressRecord | undefined,
  cardId?: string | number | null,
): CardProgressStatus {
  if (!progress || cardId === null || cardId === undefined) {
    return 'todo'
  }

  return progress.cards.items[String(cardId)]?.status || 'todo'
}

export function mergeCardStatusIntoProgress(
  progress: UserProgressRecord,
  cardId: string | number,
  status: CardProgressStatus,
  updatedAt: string,
): UserProgressRecord {
  const key = String(cardId)

  return {
    ...progress,
    cards: {
      ...progress.cards,
      updatedAt: maxTimestamp(progress.cards.updatedAt, updatedAt),
      items: {
        ...progress.cards.items,
        [key]: {
          status,
          updatedAt,
        },
      },
    },
  }
}

export function buildCardStatusCounts(progress: UserProgressRecord, totalCards: number) {
  const counts: Record<CardProgressStatus, number> = {
    todo: 0,
    learning: 0,
    learned: 0,
  }

  for (const entry of Object.values(progress.cards.items || {})) {
    if (entry.status === 'learned') {
      counts.learned += 1
    } else if (entry.status === 'learning') {
      counts.learning += 1
    }
  }

  counts.todo = Math.max(totalCards - counts.learned - counts.learning, 0)
  return counts
}

export function buildCardStatusPercentages(
  counts: Record<CardProgressStatus, number>,
  totalCards: number,
) {
  return {
    todo: totalCards ? Math.round((counts.todo / totalCards) * 100) : 0,
    learning: totalCards ? Math.round((counts.learning / totalCards) * 100) : 0,
    learned: totalCards ? Math.round((counts.learned / totalCards) * 100) : 0,
  }
}

function maxTimestamp(...values: Array<string | undefined>) {
  let next = '1970-01-01T00:00:00.000Z'
  for (const value of values) {
    if (value && value.localeCompare(next) > 0) {
      next = value
    }
  }
  return next
}
