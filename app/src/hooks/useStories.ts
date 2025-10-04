import { useMemo } from 'react';
import storiesSource from '../data/stories.json';

export type StoryRequirement = {
  requirementId: string;
  text: string;
};

export type StoryMissionDefinition = {
  missionId: string;
  title: string;
  sceneSummary?: string;
  aiRole: string;
  requirements: StoryRequirement[];
};

export type StoryDefinition = {
  storyId: string;
  title: string;
  summary: string;
  level?: string;
  tags?: string[];
  unlockCost?: number;
  missions: StoryMissionDefinition[];
};

export type StorySummary = {
  storyId: string;
  title: string;
  summary: string;
  level?: string;
  tags: string[];
  unlockCost: number;
  locked: boolean;
  missionsCount: number;
};

export type StoryRequirementState = {
  requirementId: string;
  text: string;
  met: boolean;
  feedback?: string;
};

export type StoryMission = {
  missionId: string;
  title: string;
  sceneSummary?: string;
  aiRole: string;
  requirements: StoryRequirementState[];
};

export type StoryDetail = {
  storyId: string;
  title: string;
  summary: string;
  level?: string;
  missions: StoryMission[];
};

const definitions = (storiesSource as StoryDefinition[]) || [];

export function useStories() {
  const items = useMemo<StorySummary[]>(() => {
    return definitions.map((story) => ({
      storyId: story.storyId,
      title: story.title,
      summary: story.summary,
      level: story.level,
      tags: story.tags || [],
      unlockCost: story.unlockCost ?? 0,
      locked: false,
      missionsCount: story.missions?.length || 0,
    }));
  }, []);
  return { items, loading: false, error: undefined as string | undefined };
}

export function useStoryDetail(storyId?: string) {
  const story = useMemo<StoryDetail | undefined>(() => {
    if (!storyId) return undefined;
    const found = definitions.find((s) => s.storyId === storyId);
    if (!found) return undefined;
    return {
      storyId: found.storyId,
      title: found.title,
      summary: found.summary,
      level: found.level,
      missions: (found.missions || []).map((mission) => ({
        missionId: mission.missionId,
        title: mission.title,
        sceneSummary: mission.sceneSummary,
        aiRole: mission.aiRole,
        requirements: (mission.requirements || []).map((req) => ({
          requirementId: req.requirementId,
          text: req.text,
          met: false,
        })),
      })),
    };
  }, [storyId]);

  const error = storyId && !story ? 'Historia no encontrada' : undefined;

  return { story, loading: false, error };
}
