import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { SongModel } from '#modules/songs/models'
import { SongService } from '#modules/songs/services'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import type { Routes } from '#common/types'
import type { hc } from 'hono/client'

export class SongController implements Routes {
  public controller: OpenAPIHono
  public static songClient: typeof hc
  private songService: SongService

  constructor() {
    this.controller = new OpenAPIHono()
    this.songService = new SongService()
  }

  public initRoutes() {
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/songs',
        tags: ['Songs'],
        summary: 'Retrieve songs by ID or link',
        description: 'Retrieve songs by a comma-separated list of IDs or by a direct link to the song on JioSaavn.',
        operationId: 'getSongByIdsOrLink',
        request: {
          query: z.object({
            ids: z.string().optional().openapi({
              title: 'Song IDs',
              description: 'Comma-separated list of song IDs',
              type: 'string',
              example: 'rh1gIwY_'
            }),
            link: z
              .string()
              .url()
              .optional()
              .transform((value) => value?.match(/jiosaavn\.com\/song\/[^/]+\/([^/]+)$/)?.[1])
              .openapi({
                title: 'Song Link',
                description: 'A direct link to the song on JioSaavn',
                type: 'string',
                example: 'https://www.jiosaavn.com/song/houdini/OgwhbhtDRwM'
              })
          })
        },
        responses: {
          200: {
            description: 'Successful response with song details',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean().openapi({
                    description: 'Indicates whether the request was successful',
                    type: 'boolean',
                    example: true
                  }),
                  data: z.array(SongModel).openapi({
                    title: 'Song Details',
                    description: 'Array of song details'
                  })
                })
              }
            }
          },
          400: { description: 'Bad request when query parameters are missing or invalid' },
          404: { description: 'Song not found with the given ID or link' }
        }
      }),
      async (ctx) => {
        const { link, ids } = ctx.req.valid('query')

        if (!link && !ids) {
          return ctx.json({ success: false, message: 'Either song IDs or link is required' }, 400)
        }

        const response = link
          ? await this.songService.getSongByLink(link)
          : await this.songService.getSongByIds({ songIds: ids! })

        return ctx.json({ success: true, data: response })
      }
    )

    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/songs/{id}',
        tags: ['Songs'],
        summary: 'Retrieve song by ID',
        description: 'Retrieve a song by its ID. Optionally, include lyrics in the response.',
        operationId: 'getSongById',
        request: {
          params: z.object({
            id: z.string().openapi({
              title: 'Song ID',
              description: 'ID of the song to retrieve',
              type: 'string',
              example: 'rh1gIwY_'
            })
          })
        },
        responses: {
          200: {
            description: 'Successful response with song details',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean().openapi({
                    description: 'Indicates whether the request was successful',
                    type: 'boolean',
                    example: true
                  }),
                  data: z.array(SongModel).openapi({
                    description: 'Array of songs'
                  })
                })
              }
            }
          },
          400: { description: 'Bad request when query parameters are missing or invalid' },
          404: { description: 'Song not found for the given ID' }
        }
      }),
      async (ctx) => {
        const songId = ctx.req.param('id')

        const response = await this.songService.getSongByIds({ songIds: songId })

        return ctx.json({ success: true, data: response })
      }
    )

    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/songs/{id}/suggestions',
        tags: ['Songs'],
        summary: 'Retrieve song suggestions',
        description:
          'Retrieve song suggestions based on the given song ID. This can be used to get similar songs to the one provided for infinite playback.',
        operationId: 'getSongSuggestions',
        request: {
          params: z.object({
            id: z.string().openapi({
              description: 'ID of the song to retrieve suggestions for',
              type: 'string',
              example: 'yDeAS8Eh'
            })
          }),
          query: z.object({
            limit: z.coerce.number().int().min(1).max(50).optional().openapi({
              description: 'Limit the number of suggestions to retrieve (1-50)',
              type: 'number',
              title: 'Limit',
              example: 10,
              default: 10
            })
          })
        },
        responses: {
          200: {
            description: 'Successful response with song suggestions',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean().openapi({
                    description: 'Indicates whether the request was successful',
                    type: 'boolean',
                    example: true
                  }),
                  data: z.array(SongModel).openapi({
                    description: 'Array of song suggestions'
                  })
                })
              }
            }
          },
          404: { description: 'No suggestions found for the given song' },
          502: { description: 'JioSaavn is unreachable or blocked the request' }
        }
      }),
      async (ctx) => {
        const songId = ctx.req.param('id')
        const { limit } = ctx.req.valid('query')

        const suggestions = await this.songService.getSongSuggestions({ songId, limit: limit || 10 })

        return ctx.json({ success: true, data: suggestions })
      }
    )

    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/songs/{id}/lyrics',
        tags: ['Songs'],
        summary: 'Retrieve song lyrics',
        description: 'Retrieve lyrics for a song by its ID. The song must have lyrics available.',
        operationId: 'getSongLyrics',
        request: {
          params: z.object({
            id: z.string().openapi({
              description: 'ID of the song to retrieve lyrics for',
              type: 'string',
              example: 'rh1gIwY_'
            })
          })
        },
        responses: {
          200: {
            description: 'Successful response with song lyrics',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean().openapi({
                    description: 'Indicates whether the request was successful',
                    type: 'boolean',
                    example: true
                  }),
                  data: z.object({
                    lyrics: z.string().openapi({
                      description: 'Full lyrics of the song',
                      example: 'Verse 1:\nLyrics text here...\n\nChorus:\nMore lyrics...'
                    }),
                    snippet: z.string().optional().openapi({
                      description: 'Short snippet of the lyrics'
                    }),
                    copyright: z.string().optional().openapi({
                      description: 'Copyright information for the lyrics'
                    })
                  }).nullable().openapi({
                    description: 'Lyrics data or null if not available'
                  })
                })
              }
            }
          },
          404: { description: 'Lyrics not found or not available for this song' },
          502: { description: 'JioSaavn is unreachable or blocked the request' }
        }
      }),
      async (ctx) => {
        const songId = ctx.req.param('id')

        // 1) Look up the song to find its lyrics id (and confirm it exists).
        let song
        try {
          const songs = await this.songService.getSongByIds({ songIds: songId })
          song = songs[0]
        } catch (error) {
          // Real "not found" -> 404, but upstream failures must stay 5xx
          if (error instanceof HTTPException && error.status === 404) {
            return ctx.json({ success: false, message: 'Song not found' }, 404)
          }
          throw error
        }

        if (!song) {
          return ctx.json({ success: false, message: 'Song not found' }, 404)
        }

        // 2) Always try to fetch the lyrics: the has_lyrics flag is not reliable on every response.
        const lyricsId = song.lyricsId || song.id
        const lyrics = await this.songService.getSongLyrics({ lyricsId })

        if (!lyrics) {
          return ctx.json(
            {
              success: false,
              message: 'Lyrics are not available for this song',
              data: { songId: song.id, songName: song.name, hasLyrics: song.hasLyrics, lyricsId: lyricsId }
            },
            404
          )
        }

        return ctx.json({
          success: true,
          data: {
            ...lyrics,
            songInfo: { id: song.id, name: song.name, lyricsId: lyricsId }
          }
        })
      }
    )
  }
}
