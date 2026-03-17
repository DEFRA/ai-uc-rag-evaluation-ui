import { constants as statusCodes } from 'node:http2'

import nock from 'nock'

import { createServer } from '../../../../../src/server/server.js'

const evaluationUrl = 'http://localhost:9085'

describe('#resultController', () => {
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

  describe('GET /evaluation/{runId}', () => {
    test('Should render the result page with run details', async () => {
      nock(evaluationUrl)
        .get('/evaluation/run_abc123')
        .reply(200, {
          run_id: 'run_abc123',
          status: 'completed',
          group_id: 'kg_1',
          snapshot_id: 'kg_1_v1',
          queries: [{ query: 'What is AI?', expected_answer: 'A field of computer science' }],
          rubrics: ['Score 0 to 1'],
          models: ['haiku_3'],
          results: [
            {
              question: 'What is AI?',
              expected_answer: 'A field of computer science',
              actual_answer: 'Artificial intelligence is a branch of computer science.',
              model: 'haiku_3',
              rubric: 'Score 0 to 1',
              score: 0.75,
              reason: 'Mostly correct.'
            }
          ],
          evaluation_summary: [
            {
              model: 'haiku_3',
              rubric: 'Score 0 to 1',
              average_score: 0.75,
              passed: true
            }
          ]
        })

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/evaluation/run_abc123'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('run_abc123'))
      expect(result).toEqual(expect.stringContaining('Completed'))
      expect(result).toEqual(expect.stringContaining('kg_1'))
      expect(result).toEqual(expect.stringContaining('haiku_3'))
      expect(result).toEqual(expect.stringContaining('What is AI?'))
      expect(result).toEqual(expect.stringContaining('Artificial intelligence is a branch of computer science.'))
      expect(result).toEqual(expect.stringContaining('0.75'))
      expect(result).toEqual(expect.stringContaining('Mostly correct.'))
      expect(result).toEqual(expect.stringContaining('Evaluation Summary'))
      expect(result).toEqual(expect.stringContaining('Passed'))
    })

    test('Should show refresh button when run is not completed', async () => {
      nock(evaluationUrl)
        .get('/evaluation/run_abc123')
        .reply(200, {
          run_id: 'run_abc123',
          status: 'in_progress',
          group_id: 'kg_1',
          snapshot_id: 'kg_1_v1',
          queries: [],
          rubrics: [],
          models: ['haiku_3'],
          results: []
        })

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/evaluation/run_abc123'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('Refresh'))
      expect(result).toEqual(expect.stringContaining('Results will appear here once the evaluation is complete.'))
    })

    test('Should return 500 error page when backend returns 500', async () => {
      nock(evaluationUrl)
        .get('/evaluation/run_abc123')
        .reply(500, 'Internal Server Error')

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/evaluation/run_abc123'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })

    test('Should include download link on result page', async () => {
      nock(evaluationUrl)
        .get('/evaluation/run_abc123')
        .reply(200, {
          run_id: 'run_abc123',
          status: 'completed',
          group_id: 'kg_1',
          snapshot_id: 'kg_1_v1',
          models: ['haiku_3'],
          results: []
        })

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/evaluation/run_abc123'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('/evaluation/run_abc123/download'))
      expect(result).toEqual(expect.stringContaining('Download raw JSON'))
    })
  })

  describe('GET /evaluation/{runId}/download', () => {
    test('Should return raw JSON with content-disposition header', async () => {
      const runData = {
        run_id: 'run_abc123',
        status: 'completed',
        group_id: 'kg_1',
        snapshot_id: 'kg_1_v1',
        models: ['haiku_3'],
        results: []
      }

      nock(evaluationUrl)
        .get('/evaluation/run_abc123')
        .reply(200, runData)

      const { result, statusCode, headers } = await server.inject({
        method: 'GET',
        url: '/evaluation/run_abc123/download'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(headers['content-type']).toMatch(/application\/json/)
      expect(headers['content-disposition']).toBe('attachment; filename="evaluation-run_abc123.json"')
      expect(JSON.parse(result)).toEqual(runData)
    })

    test('Should return 500 when backend returns 500', async () => {
      nock(evaluationUrl)
        .get('/evaluation/run_abc123')
        .reply(500, 'Internal Server Error')

      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/evaluation/run_abc123/download'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
    })
  })
})
