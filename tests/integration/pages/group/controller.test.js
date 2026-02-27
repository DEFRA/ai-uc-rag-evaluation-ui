import { constants as statusCodes } from 'node:http2'

import nock from 'nock'

import { createServer } from '../../../../src/server/server.js'

const backendUrl = 'http://localhost:8085'

const validPayload = {
  name: 'Test Group',
  owner: 'test-owner',
  description: 'A test group',
}

describe('#groupController', () => {
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

  describe('GET /group/add_group', () => {
    test('Should render the create group page', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/group/add_group'
      })

      expect(result).toEqual(expect.stringContaining('Create knowledge group |'))
      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
    })
  })

  describe('POST /group', () => {
    test('Should redirect to group page on successful creation', async () => {
      nock(backendUrl)
        .post('/knowledge/groups')
        .reply(200, {
          groupId: 'kg_test123',
          title: 'Test Group',
          description: 'A test group',
          owner: 'test-owner'
        })

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/group',
        payload: validPayload
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_SEE_OTHER)
      expect(headers.location).toBe('/group/kg_test123')
    })

    test('Should return 500 error page when backend returns 500', async () => {
      nock(backendUrl)
        .post('/knowledge/groups')
        .reply(500, 'Internal Server Error')

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/group',
        payload: validPayload
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
})
