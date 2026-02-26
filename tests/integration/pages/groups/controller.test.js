import { constants as statusCodes } from 'node:http2'

import { vi } from 'vitest'
import { fetch } from 'undici'

import { createServer } from '../../../../src/server/server.js'

vi.mock('undici', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, fetch: vi.fn() }
})

describe('#groupsController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /groups', () => {
    test('Should render the groups list page with groups', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            groupId: 'kg_test123',
            title: 'Test Group',
            description: 'A test group',
            owner: 'test-owner'
          }
        ])
      })

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/groups'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('Knowledge groups |'))
      expect(result).toEqual(expect.stringContaining('kg_test123'))
      expect(result).toEqual(expect.stringContaining('Test Group'))
      expect(result).toEqual(expect.stringContaining('A test group'))
    })

    test('Should render the groups list page with no groups message when empty', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/groups'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('No knowledge groups found.'))
    })

    test('Should return 500 error page when backend returns 500', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error')
      })

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/groups'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })
  })
})
