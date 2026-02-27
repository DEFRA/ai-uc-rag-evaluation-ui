import { constants as statusCodes } from 'node:http2'

import { MockAgent, setGlobalDispatcher, getGlobalDispatcher } from 'undici'

import { createServer } from '../../../../src/server/server.js'

const backendUrl = 'http://localhost:8085'

describe('#groupsController', () => {
  let server
  let mockAgent
  let mockPool
  let originalDispatcher

  beforeAll(async () => {
    originalDispatcher = getGlobalDispatcher()
    mockAgent = new MockAgent()
    mockAgent.disableNetConnect()
    setGlobalDispatcher(mockAgent)
    mockPool = mockAgent.get(backendUrl)

    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    setGlobalDispatcher(originalDispatcher)
    await mockAgent.close()
    await server.stop({ timeout: 0 })
  })

  describe('GET /group', () => {
    test('Should render the groups list page with groups', async () => {
      mockPool
        .intercept({ path: '/knowledge/groups', method: 'GET' })
        .reply(200, [
          {
            groupId: 'kg_test123',
            title: 'Test Group',
            description: 'A test group',
            owner: 'test-owner'
          }
        ])

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/group'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('Knowledge groups |'))
      expect(result).toEqual(expect.stringContaining('kg_test123'))
      expect(result).toEqual(expect.stringContaining('Test Group'))
      expect(result).toEqual(expect.stringContaining('A test group'))
    })

    test('Should render the groups list page with no groups message when empty', async () => {
      mockPool
        .intercept({ path: '/knowledge/groups', method: 'GET' })
        .reply(200, [])

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/group'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('No knowledge groups found.'))
    })

    test('Should return 500 error page when backend returns 500', async () => {
      mockPool
        .intercept({ path: '/knowledge/groups', method: 'GET' })
        .reply(500, 'Internal Server Error')

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/group'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })
  })

  describe('GET /group/{groupId}', () => {
    test('Should render the group detail page', async () => {
      mockPool
        .intercept({ path: '/knowledge/groups/kg_test123', method: 'GET' })
        .reply(200, {
          groupId: 'kg_test123',
          title: 'Test Group',
          description: 'A test group',
          owner: 'test-owner',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          sources: {}
        })

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/group/kg_test123'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('Test Group'))
      expect(result).toEqual(expect.stringContaining('kg_test123'))
      expect(result).toEqual(expect.stringContaining('No sources found.'))
    })

    test('Should return 500 error page when backend returns 500', async () => {
      mockPool
        .intercept({ path: '/knowledge/groups/kg_test123', method: 'GET' })
        .reply(500, 'Internal Server Error')

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/group/kg_test123'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })
  })

  describe('GET /group/{groupId}/add_source', () => {
    test('Should render the add source form', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/group/kg_test123/add_source'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('Add source |'))
    })
  })

  describe('POST /group/{groupId}', () => {
    test('Should redirect to group page on successful source addition', async () => {
      mockPool
        .intercept({ path: '/knowledge/groups/kg_test123/sources', method: 'PATCH' })
        .reply(200, {})

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/group/kg_test123',
        payload: {
          name: 'Test Source',
          type: 'PRECHUNKED_BLOB',
          location: 's3://bucket/key'
        }
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_SEE_OTHER)
      expect(headers.location).toBe('/group/kg_test123')
    })

    test('Should return 400 and show errors when fields are empty', async () => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/group/kg_test123',
        payload: {}
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_BAD_REQUEST)
      expect(result).toEqual(expect.stringContaining('There is a problem'))
    })

    test('Should return 500 error page when backend returns 500', async () => {
      mockPool
        .intercept({ path: '/knowledge/groups/kg_test123/sources', method: 'PATCH' })
        .reply(500, 'Internal Server Error')

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/group/kg_test123',
        payload: {
          name: 'Test Source',
          type: 'PRECHUNKED_BLOB',
          location: 's3://bucket/key'
        }
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })
  })
})
