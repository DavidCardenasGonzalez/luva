export type LearningItemOptionKey = 'a' | 'b' | 'c'

export type LearningItem = {
  id: number
  label: string
  examples: string[]
  options: Record<LearningItemOptionKey, string>
  answer: LearningItemOptionKey
  explanation: string
  prompt?: string
}

export const learningItems = __LUVA_LEARNING_ITEMS__ as LearningItem[]

const learningItemsById = new Map(learningItems.map((item) => [String(item.id), item]))

export function getLearningItemById(cardId?: string | number | null) {
  if (cardId === null || cardId === undefined) {
    return undefined
  }

  return learningItemsById.get(String(cardId))
}
