export const RECORD_DEV_LIKES = false;

export function shouldRecordLikes(): boolean {
  return !__DEV__ || RECORD_DEV_LIKES;
}
