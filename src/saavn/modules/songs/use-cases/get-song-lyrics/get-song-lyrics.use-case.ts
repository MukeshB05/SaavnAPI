import { z } from 'zod'
import { Endpoints } from '#common/constants'
import { useFetch } from '#common/helpers'
import { ApiContextEnum } from '#common/enums'
import type { IUseCase } from '#common/types'

export interface GetSongLyricsArgs {
  lyricsId: string
}

const LyricsResponseSchema = z.object({
  lyrics: z.string(),
  snippet: z.string().optional(),
  copyright: z.string().optional()
})

export type LyricsResponse = z.infer<typeof LyricsResponseSchema>

// JioSaavn returns lyrics as HTML with <br> line breaks
const cleanLyrics = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim()

export class GetSongLyricsUseCase implements IUseCase<GetSongLyricsArgs, LyricsResponse | null> {
  constructor() {}

  // Returns null ONLY when the song has no lyrics.
  // Upstream failures (blocked, timeout, bad JSON) are thrown as HTTPException
  // so the API answers 502/504 instead of a misleading "no lyrics" 404.
  execute = async (args: GetSongLyricsArgs): Promise<LyricsResponse | null> => {
    const { lyricsId } = args

    if (!lyricsId) return null

    const { data } = await useFetch<{ lyrics?: string; snippet?: string; lyrics_copyright?: string; copyright?: string }>({
      endpoint: Endpoints.songs.lyrics,
      params: { lyrics_id: lyricsId },
      context: ApiContextEnum.WEB6DOT0
    })

    if (!data || typeof data.lyrics !== 'string' || !data.lyrics.trim()) return null

    return {
      lyrics: cleanLyrics(data.lyrics),
      snippet: data.snippet ? cleanLyrics(data.snippet) : undefined,
      copyright: data.lyrics_copyright || data.copyright || undefined
    }
  }
}
