import { constants as statusCodes } from 'node:http2'

import nock from 'nock'

import { createServer } from '../../../../../src/server/server.js'

const evaluationUrl = 'http://localhost:9085'

describe('#listController', () => {
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

  describe('GET /evaluation', () => {
    test('Should render the list page with runs', async () => {
      nock(evaluationUrl)
        .get('/evaluation')
        .reply(200, {
          runs: [
            { run_id: 'run_abc123', status: 'completed' },
            { run_id: 'run_def456', status: 'in_progress' }
          ]
        })

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/evaluation'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('Evaluation Runs'))
      expect(result).toEqual(expect.stringContaining('run_abc123'))
      expect(result).toEqual(expect.stringContaining('run_def456'))
      expect(result).toEqual(expect.stringContaining('Completed'))
      expect(result).toEqual(expect.stringContaining('/evaluation/run_abc123'))
    })

    test('Should render the empty state when no runs exist', async () => {
      nock(evaluationUrl)
        .get('/evaluation')
        .reply(200, { runs: [] })

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/evaluation'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('No evaluation runs found.'))
    })

    test('Should return 500 error page when backend returns 500', async () => {
      nock(evaluationUrl)
        .get('/evaluation')
        .reply(500, 'Internal Server Error')

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/evaluation'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })
  })
})
