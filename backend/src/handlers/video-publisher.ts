import type { ScheduledEvent } from 'aws-lambda';
import { publishScheduledVideos } from '../video-publisher';

export async function handler(_event: ScheduledEvent) {
  const summary = await publishScheduledVideos();
  console.log(JSON.stringify(summary));
  return summary;
}
