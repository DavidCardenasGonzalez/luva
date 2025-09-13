import items from '../data/learning_items.json';

export type LearningItem = { id: number; label: string; example: string };

export function useLearningItems() {
  // Static for now; could be extended to remote fetch later
  return { items: items as LearningItem[] };
}

