import { constants as statusCodes } from 'node:http2'

import { vi } from 'vitest'
import { fetch } from 'undici'

import { createServer } from '../../../../src/server/server.js'

vi.mock('undici', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, fetch: vi.fn() }
})

describe('#groupController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /group', () => {
    test('Should render the create group page', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/group'
      })

      expect(result).toEqual(expect.stringContaining('Create knowledge group |'))
      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
    })
  })

  describe('POST /group', () => {
    test('Should redirect to group page on successful creation', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          groupId: 'kg_test123',
          title: 'Test Group',
          description: 'A test group',
          owner: 'test-owner'
        })
      })

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/group',
        payload: {
          name: 'Test Group',
          owner: 'test-owner',
          description: 'A test group'
        }
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_SEE_OTHER)
      expect(headers.location).toBe('/group/kg_test123')
    })

    test('Should return 500 error page when backend returns 500', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error')
      })

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/group',
        payload: {
          name: 'Test Group',
          owner: 'test-owner',
          description: 'A test group'
        }
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })

    test('Should return 400 and show errors when fields are empty', async () => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/group',
        payload: {}
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_BAD_REQUEST)
      expect(result).toEqual(expect.stringContaining('There is a problem'))
    })
  })

  describe('GET /group/{groupId}', () => {
    test('Should render the group created page', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/group/kg_test123'
      })

      expect(result).toEqual(expect.stringContaining('Group created |'))
      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
    })
  })
})
