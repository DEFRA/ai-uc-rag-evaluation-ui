import { constants as statusCodes } from 'node:http2'

import nock from 'nock'

import { createServer } from '../../../../../src/server/server.js'

const evaluationUrl = 'http://localhost:9085'

describe('#truthListController', () => {
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

  describe('GET /truth', () => {
    test('Should render the list page with truth sources', async () => {
      nock(evaluationUrl)
        .get('/truth-sources')
        .reply(200, {
          sources: [
            {
              id: 'ts_abc123',
              dataset_id: 'kg_1',
              question_answers: [
                { question: 'What is AI?', answer: 'A field of computer science' }
              ]
            },
            {
              id: 'ts_def456',
              dataset_id: 'kg_2',
              question_answers: []
            }
          ]
        })

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/truth'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('Truth Data Sources'))
      expect(result).toEqual(expect.stringContaining('ts_abc123'))
      expect(result).toEqual(expect.stringContaining('ts_def456'))
      expect(result).toEqual(expect.stringContaining('/truth/ts_abc123'))
      expect(result).toEqual(expect.stringContaining('/truth/ts_def456'))
    })

    test('Should render the empty state when no sources exist', async () => {
      nock(evaluationUrl)
        .get('/truth-sources')
        .reply(200, { sources: [] })

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/truth'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('No truth data sources found.'))
    })

    test('Should return 500 error page when backend returns 500', async () => {
      nock(evaluationUrl)
        .get('/truth-sources')
        .reply(500, 'Internal Server Error')

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/truth'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })
  })
})
