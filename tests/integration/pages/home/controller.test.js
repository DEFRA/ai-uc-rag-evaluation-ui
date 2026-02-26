import { constants as statusCodes } from 'node:http2'

import { vi } from 'vitest'
import { fetch } from 'undici'

import { createServer } from '../../../../src/server/server.js'

vi.mock('undici', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, fetch: vi.fn() }
})

describe('#homeController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should serve groups page at root', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/'
    })

    expect(result).toEqual(expect.stringContaining('Knowledge groups |'))
    expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
  })
})
