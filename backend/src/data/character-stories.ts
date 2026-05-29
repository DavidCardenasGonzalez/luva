import type { CharacterDefinition, StoryDefinition, StoryMission } from '../types';

function toStoryMission(character: CharacterDefinition): StoryMission {
  const {
    characterId: _characterId,
    storyId: _storyId,
    storyTitle: _storyTitle,
    storySummary: _storySummary,
    storyIsInitial: _storyIsInitial,
    storyLevel: _storyLevel,
    storyTags: _storyTags,
    storyUnlockCost: _storyUnlockCost,
    sceneIndex: _sceneIndex,
    ...mission
  } = character;

  return {
    ...mission,
    requirements: mission.requirements || [],
  };
}

export function storiesFromCharacters(characters: CharacterDefinition[]): StoryDefinition[] {
  const stories = new Map<
    string,
    {
      story: Omit<StoryDefinition, 'missions'>;
      missions: Array<{ order: number; sceneIndex: number; mission: StoryMission }>;
    }
  >();

  characters.forEach((character, order) => {
    let entry = stories.get(character.storyId);
    if (!entry) {
      entry = {
        story: {
          storyId: character.storyId,
          isInitial: character.storyIsInitial,
          title: character.storyTitle,
          summary: character.storySummary,
          level: character.storyLevel,
          tags: character.storyTags,
          unlockCost: character.storyUnlockCost,
        },
        missions: [],
      };
      stories.set(character.storyId, entry);
    }

    entry.missions.push({
      order,
      sceneIndex:
        typeof character.sceneIndex === 'number' && Number.isFinite(character.sceneIndex)
          ? Math.max(0, Math.floor(character.sceneIndex))
          : order,
      mission: toStoryMission(character),
    });
  });

  return [...stories.values()].map((entry) => ({
    ...entry.story,
    missions: entry.missions
      .sort((left, right) => left.sceneIndex - right.sceneIndex || left.order - right.order)
      .map(({ mission }) => mission),
  }));
}
