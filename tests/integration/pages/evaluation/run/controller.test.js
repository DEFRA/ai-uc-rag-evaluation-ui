import { constants as statusCodes } from 'node:http2'

import nock from 'nock'

import { createServer } from '../../../../../src/server/server.js'

const evaluationUrl = 'http://localhost:9085'

const validRequestBody = {
  group_id: 'kg_1',
  snapshot_id: 'kg_1_v1',
  queries: [{ query: 'What is AI?', expected_answer: 'A field of computer science' }],
  rubrics: ['Score 0 to 1'],
  models: ['haiku_3']
}

describe('#runController', () => {
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

  describe('GET /evaluation/run', () => {
    test('Should render the evaluation form', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/evaluation/run'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('Run Evaluation'))
      expect(result).toEqual(expect.stringContaining('<textarea'))
      expect(result).toEqual(expect.stringContaining('group_id'))
      expect(result).toEqual(expect.stringContaining('snapshot_id'))
    })
  })

  describe('POST /evaluation/run', () => {
    test('Should redirect to the result page on success', async () => {
      nock(evaluationUrl)
        .post('/evaluation')
        .reply(200, { run_id: 'run_abc123', status: 'accepted', ...validRequestBody, results: [] })

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/evaluation/run',
        payload: { body: JSON.stringify(validRequestBody) }
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_SEE_OTHER)
      expect(headers.location).toBe('/evaluation/run_abc123')
    })

    test('Should return 400 and show error when body is invalid JSON', async () => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/evaluation/run',
        payload: { body: 'not valid json' }
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_BAD_REQUEST)
      expect(result).toEqual(expect.stringContaining('Invalid JSON'))
    })

    test('Should return 500 error page when backend returns 500', async () => {
      nock(evaluationUrl)
        .post('/evaluation')
        .reply(500, 'Internal Server Error')

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/evaluation/run',
        payload: { body: JSON.stringify(validRequestBody) }
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })
  })
})
