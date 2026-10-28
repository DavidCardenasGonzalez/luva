export type SeriesStatus = 'draft' | 'published'

export type SeriesEpisode = {
  episodeId: string
  episodeNumber: number
  title: string
  durationMs: number
  videoUrl: string
  subtitlesUrl?: string
  publicationStatus: SeriesStatus
}

export type SeriesManifest = {
  series: {
    seriesId: string
    title: string
    synopsis: string
    coverUrl: string
    chatCharacterIds: string[]
    catalogOrder: number
    publicationStatus: SeriesStatus
  }
  episodes: SeriesEpisode[]
}

export type SeriesDetail = {
  manifest: SeriesManifest
  version: number
  createdAt: string
  updatedAt: string
}

export type SeriesSummary = SeriesManifest['series'] & {
  episodeCount: number
  totalEpisodeCount: number
  version: number
  createdAt: string
  updatedAt: string
}
