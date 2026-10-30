import { Endpoints } from '#common/constants'
import { ApiContextEnum } from '#common/enums'
import { useFetch } from '#common/helpers'
import { HTTPException } from 'hono/http-exception'
import type { IUseCase } from '#common/types'

export class CreateSongStationUseCase implements IUseCase<string, string> {
  constructor() {}

  async execute(songId: string) {
    const encodedSongId = JSON.stringify([encodeURIComponent(songId)])

    // JioSaavn answers differently per context, so try android first and
    // fall back to web6dot0 before giving up.
    const contexts = [ApiContextEnum.ANDROID, ApiContextEnum.WEB6DOT0]
    let lastError: HTTPException | null = null

    for (const context of contexts) {
      try {
        const { data } = await useFetch<{ stationid?: string }>({
          endpoint: Endpoints.songs.station,
          params: { entity_id: encodedSongId, entity_type: 'queue' },
          context
        })

        if (data?.stationid) return data.stationid
      } catch (error) {
        lastError = error instanceof HTTPException ? error : null
      }
    }

    // Upstream failure (blocked / timeout) -> 502, otherwise the song simply has no station -> 404
    if (lastError) throw lastError

    throw new HTTPException(404, { message: 'could not create a suggestion station for this song' })
  }
}
