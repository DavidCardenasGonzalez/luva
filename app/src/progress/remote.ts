import { api } from '../api/api';
import { normalizeUserProgressRecord } from './sync';
import type { UserProgressRecord } from './types';

type UserProgressResponse = {
  progress?: unknown;
};

export async function fetchUserProgress(): Promise<UserProgressRecord> {
  const response = await api.get<UserProgressResponse>('/users/me/progress');
  return normalizeUserProgressRecord(response?.progress);
}

export async function mergeUserProgress(
  progress: Partial<UserProgressRecord>
): Promise<UserProgressRecord> {
  const response = await api.post<UserProgressResponse>('/users/me/progress', { progress });
  return normalizeUserProgressRecord(response?.progress);
}
