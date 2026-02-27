import { constants as statusCodes } from 'node:http2'

import nock from 'nock'

import { createServer } from '../../../../src/server/server.js'

const backendUrl = 'http://localhost:8085'

describe('#groupsController', () => {
  let server

  beforeAll(async () => {
    nock.disableNetConnect()
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    nock.enableNetConnect()
    await server.stop({ timeout: 0 })
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('GET /groups', () => {
    test('Should render the groups list page with groups', async () => {
      nock(backendUrl)
        .get('/knowledge/groups')
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
        url: '/groups'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('Knowledge groups |'))
      expect(result).toEqual(expect.stringContaining('kg_test123'))
      expect(result).toEqual(expect.stringContaining('Test Group'))
      expect(result).toEqual(expect.stringContaining('A test group'))
    })

    test('Should render the groups list page with no groups message when empty', async () => {
      nock(backendUrl)
        .get('/knowledge/groups')
        .reply(200, [])

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/groups'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('No knowledge groups found.'))
    })

    test('Should return 500 error page when backend returns 500', async () => {
      nock(backendUrl)
        .get('/knowledge/groups')
        .reply(500, 'Internal Server Error')

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/groups'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })
  })

  describe('GET /groups/{groupId}', () => {
    test('Should render the group detail page', async () => {
      nock(backendUrl)
        .get('/knowledge/groups/kg_test123')
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
        url: '/groups/kg_test123'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('Test Group'))
      expect(result).toEqual(expect.stringContaining('kg_test123'))
      expect(result).toEqual(expect.stringContaining('No sources found.'))
    })

    test('Should return 500 error page when backend returns 500', async () => {
      nock(backendUrl)
        .get('/knowledge/groups/kg_test123')
        .reply(500, 'Internal Server Error')

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/groups/kg_test123'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })
  })

  describe('GET /groups/{groupId}/source/add', () => {
    test('Should render the add source form', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/groups/kg_test123/source/add'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('Add source |'))
    })
  })

  describe('POST /groups/{groupId}/source', () => {
    test('Should redirect to group page on successful source addition', async () => {
      nock(backendUrl)
        .patch('/knowledge/groups/kg_test123/sources')
        .reply(200, {})

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/groups/kg_test123/source',
        payload: {
          name: 'Test Source',
          type: 'PRECHUNKED_BLOB',
          location: 's3://bucket/key'
        }
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_SEE_OTHER)
      expect(headers.location).toBe('/groups/kg_test123')
    })

    test('Should return 400 and show errors when fields are empty', async () => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/groups/kg_test123/source',
        payload: {}
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_BAD_REQUEST)
      expect(result).toEqual(expect.stringContaining('There is a problem'))
    })

    test('Should return 500 error page when backend returns 500', async () => {
      nock(backendUrl)
        .patch('/knowledge/groups/kg_test123/sources')
        .reply(500, 'Internal Server Error')

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/groups/kg_test123/source',
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
