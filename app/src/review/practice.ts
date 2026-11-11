import type { ReviewItem, ReviewPage } from './types';

const isSlot = (character: string) => /[\p{L}\p{N}]/u.test(character);

export function answerCharacters(text: string) {
  return Array.from(text.normalize('NFC')).filter(isSlot);
}

export function makeSlots(text: string) {
  let index = 0;
  return text.normalize('NFC').trim().split(/\s+/u).map(word =>
    Array.from(word, character => isSlot(character) ? { index: index++ } : { character }),
  );
}

export function checkAnswer(expected: string[], typed: string[]) {
  if (!expected.length || expected.length !== typed.length) return undefined;
  return expected.map((character, index) => character.toLowerCase() === typed[index].toLowerCase());
}

export async function loadPracticeItems(getPage: (cursor?: string) => Promise<ReviewPage>, isActive: () => boolean) {
  const items = new Map<string, ReviewItem>();
  let cursor: string | undefined;
  do {
    const page = await getPage(cursor);
    if (!isActive()) return [];
    for (const item of page.items) {
      if (item.status === 'pending' && /^en(?:-|$)/i.test(item.sourceLanguage) && item.translatedText.trim() && answerCharacters(item.originalText).length) {
        items.set(item.id, item);
      }
    }
    cursor = page.nextCursor;
  } while (cursor);
  return shufflePracticeItems([...items.values()]);
}

export function shufflePracticeItems(items: ReviewItem[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}
