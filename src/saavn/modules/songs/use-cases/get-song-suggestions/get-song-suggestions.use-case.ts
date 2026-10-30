import { Endpoints } from '#common/constants'
import { ApiContextEnum } from '#common/enums'
import { useFetch } from '#common/helpers'
import { createSongPayload } from '#modules/songs/helpers'
import { CreateSongStationUseCase } from '#modules/songs/use-cases'
import { HTTPException } from 'hono/http-exception'
import type { IUseCase } from '#common/types'
import type { SongAPIResponseModel, SongModel } from '#modules/songs/models'
import type { z } from 'zod'

export interface GetSongSuggestionsArgs {
  songId: string
  limit: number
}

type SongApi = z.infer<typeof SongAPIResponseModel>
type Song = z.infer<typeof SongModel>

export class GetSongSuggestionsUseCase implements IUseCase<GetSongSuggestionsArgs, Song[]> {
  private readonly createSongStation: CreateSongStationUseCase

  constructor() {
    this.createSongStation = new CreateSongStationUseCase()
  }

  async execute({ songId, limit }: GetSongSuggestionsArgs): Promise<Song[]> {
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.trunc(limit), 1), 50) : 10

    // 1) Preferred: radio station based suggestions
    let songs: Song[] = []
    let stationError: unknown = null

    try {
      songs = await this.fromStation(songId, safeLimit)
    } catch (error) {
      stationError = error
    }

    // 2) Fallback: recommendation endpoint (works even when station creation is blocked)
    if (songs.length === 0) {
      try {
        songs = await this.fromRecommendations(songId, safeLimit)
      } catch (error) {
        stationError = stationError || error
      }
    }

    if (songs.length === 0) {
      if (stationError instanceof HTTPException && stationError.status >= 500) throw stationError
      throw new HTTPException(404, { message: 'no suggestions found for the given song' })
    }

    return songs
  }

  private async fromStation(songId: string, limit: number): Promise<Song[]> {
    const stationId = await this.createSongStation.execute(songId)

    const { data } = await useFetch<Record<string, unknown>>({
      endpoint: Endpoints.songs.suggestions,
      params: { stationid: stationId, k: limit },
      context: ApiContextEnum.ANDROID
    })

    if (!data || typeof data !== 'object' || 'error' in data) return []

    return Object.entries(data)
      .filter(([key]) => key !== 'stationid')
      .map(([, element]) => element as { song?: SongApi } | null)
      .filter((element): element is { song: SongApi } => !!element && typeof element === 'object' && !!element.song)
      .map((element) => createSongPayload(element.song))
      .slice(0, limit)
  }

  private async fromRecommendations(songId: string, limit: number): Promise<Song[]> {
    const { data } = await useFetch<unknown>({
      endpoint: Endpoints.recommendations.songs,
      params: { pid: songId },
      context: ApiContextEnum.ANDROID
    })

    // The response is either an array of songs or an object keyed by song id
    const candidates: unknown[] = Array.isArray(data)
      ? data
      : data && typeof data === 'object'
        ? Object.values(data as Record<string, unknown>).flat()
        : []

    return candidates
      .filter((song): song is SongApi => !!song && typeof song === 'object' && 'id' in song && 'title' in song)
      .map((song) => createSongPayload(song))
      .slice(0, limit)
  }
}
