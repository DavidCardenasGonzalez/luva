export type MicrodramaCharacter = {
  characterId: string;
  name: string;
  avatarUrl?: string;
  avatarXsUrl?: string;
  avatarMdUrl?: string;
};

export type MicrodramaSeries = {
  seriesId: string;
  title: string;
  synopsis: string;
  coverUrl: string;
  episodeCount: number;
  firstEpisodeId: string;
  chatCharacters: MicrodramaCharacter[];
};

export type MicrodramaEpisode = {
  episodeId: string;
  seriesId: string;
  episodeNumber: number;
  title: string;
  durationMs: number;
  videoUrl: string;
  subtitlesUrl?: string;
  subtitlesLanguage: 'en';
  accessPolicy: 'free';
};

export type MicrodramaProgressSummary = {
  seriesId: string;
  resumeEpisodeId: string;
  resumePositionMs: number;
  revision: number;
  updatedAt: string;
  completedAt?: string;
};

export type MicrodramaEpisodeProgress = {
  seriesId: string;
  episodeId: string;
  positionMs: number;
  completed: boolean;
  updatedAt: string;
};

export type MicrodramaDetail = { series: MicrodramaSeries; episodes: MicrodramaEpisode[] };
export type MicrodramaPage = { items: MicrodramaSeries[]; nextCursor?: string };
