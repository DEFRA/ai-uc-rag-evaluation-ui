import { constants as statusCodes } from 'node:http2'

import nock from 'nock'

import { createServer } from '../../../../src/server/server.js'

const backendUrl = 'http://localhost:8085'

const validGroupPayload = {
  name: 'Test Group',
  owner: 'test-owner',
  description: 'A test group'
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

  describe('GET /group', () => {
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
        url: '/group'
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
        url: '/group'
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
        url: '/group'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })
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

  describe('GET /group/{groupId}', () => {
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
        url: '/group/kg_test123'
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
        url: '/group/kg_test123'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })
  })

  describe('GET /group/{groupId}/upload_source', () => {
    test('Should render the upload form with the upload URL', async () => {
      nock(backendUrl)
        .post('/upload-initiate')
        .reply(200, {
          uploadId: 'upload_test123',
          uploadUrl: 'http://localhost:7337/upload-and-scan/test-uuid',
          statusUrl: 'http://localhost:7337/status/test-uuid'
        })

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/group/kg_test123/upload_source'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('Upload source file |'))
      expect(result).toEqual(expect.stringContaining('http://localhost:7337/upload-and-scan/test-uuid'))
    })

    test('Should return 500 when backend returns 500', async () => {
      nock(backendUrl)
        .post('/upload-initiate')
        .reply(500, 'Internal Server Error')

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/group/kg_test123/upload_source'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })
  })

  describe('GET /group/{groupId}/add_source', () => {
    test('Should render the add source form with location pre-filled', async () => {
      let capturedCorrelationId

      nock(backendUrl)
        .post('/upload-initiate')
        .reply(function (_uri, requestBody) {
          const body = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody
          capturedCorrelationId = new URL(body.redirect).searchParams.get('correlation_id')
          return [200, {
            uploadId: 'upload_test123',
            uploadUrl: 'http://localhost:7337/upload-and-scan/test-uuid',
            statusUrl: 'http://localhost:7337/status/test-uuid'
          }]
        })

      const uploadPageResponse = await server.inject({
        method: 'GET',
        url: '/group/kg_test123/upload_source'
      })

      nock('http://localhost:7337')
        .get('/status/test-uuid')
        .reply(200, {
          form: { file: { fileId: 'file_test123' } }
        })

      const cookies = [].concat(uploadPageResponse.headers['set-cookie'])
        .map((c) => c.split(';')[0])
        .join('; ')

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: `/group/kg_test123/add_source?correlation_id=${capturedCorrelationId}`,
        headers: { cookie: cookies }
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('Add source |'))
      expect(result).toEqual(expect.stringContaining('upload_test123/file_test123'))
    })

    test('Should return 500 when correlation_id is not in session', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/group/kg_test123/add_source?correlation_id=unknown-id'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
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
        payload: validGroupPayload
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
        payload: validGroupPayload
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

  describe('POST /group/{groupId}', () => {

    test('Should redirect to group page on successful source addition', async () => {
      nock(backendUrl)
        .patch('/knowledge/groups/kg_test123/sources')
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
      nock(backendUrl)
        .patch('/knowledge/groups/kg_test123/sources')
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
