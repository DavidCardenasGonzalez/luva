import items from '../data/learning_items.json';

export type LearningItemOptionKey = 'a' | 'b' | 'c';
export type LearningItem = {
  id: number;
  label: string;
  examples: string[];
  options: Record<LearningItemOptionKey, string>;
  answer: LearningItemOptionKey;
  explanation: string;
  prompt?: string;
};

export function useLearningItems() {
  // Static for now; could be extended to remote fetch later
  return { items: items as LearningItem[] };
}
