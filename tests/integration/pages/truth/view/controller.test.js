import { constants as statusCodes } from 'node:http2'

import nock from 'nock'

import { createServer } from '../../../../../src/server/server.js'

const evaluationUrl = 'http://localhost:9085'

const truthSource = {
  id: 'ts_abc123',
  dataset_id: 'kg_1',
  question_answers: [
    { question: 'What is AI?', answer: 'A field of computer science' },
    { question: 'What is ML?', answer: 'A subset of AI' }
  ]
}

describe('#truthViewController', () => {
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

  describe('GET /truth/{sourceId}', () => {
    test('Should render the view page with source details and Q&A pairs', async () => {
      nock(evaluationUrl)
        .get('/truth-sources/ts_abc123')
        .reply(200, truthSource)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/truth/ts_abc123'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('ts_abc123'))
      expect(result).toEqual(expect.stringContaining('kg_1'))
      expect(result).toEqual(expect.stringContaining('What is AI?'))
      expect(result).toEqual(expect.stringContaining('A field of computer science'))
      expect(result).toEqual(expect.stringContaining('What is ML?'))
      expect(result).toEqual(expect.stringContaining('A subset of AI'))
    })

    test('Should render add and delete buttons', async () => {
      nock(evaluationUrl)
        .get('/truth-sources/ts_abc123')
        .reply(200, truthSource)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/truth/ts_abc123'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('Add question and answer'))
      expect(result).toEqual(expect.stringContaining('delete-0'))
      expect(result).toEqual(expect.stringContaining('delete-1'))
      expect(result).toEqual(expect.stringContaining('Save changes'))
    })

    test('Should return 500 error page when backend returns 500', async () => {
      nock(evaluationUrl)
        .get('/truth-sources/ts_abc123')
        .reply(500, 'Internal Server Error')

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/truth/ts_abc123'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })
  })

  describe('POST /truth/{sourceId}', () => {
    test('Should add a new empty Q&A row when action is add', async () => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/truth/ts_abc123',
        payload: {
          action: 'add',
          count: '2',
          dataset_id: 'kg_1',
          question_0: 'What is AI?',
          answer_0: 'A field of computer science',
          question_1: 'What is ML?',
          answer_1: 'A subset of AI'
        }
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('question_0'))
      expect(result).toEqual(expect.stringContaining('question_1'))
      expect(result).toEqual(expect.stringContaining('question_2'))
      expect(result).toEqual(expect.stringContaining('What is AI?'))
    })

    test('Should remove a Q&A row when action is delete-N', async () => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/truth/ts_abc123',
        payload: {
          action: 'delete-0',
          count: '2',
          dataset_id: 'kg_1',
          question_0: 'What is AI?',
          answer_0: 'A field of computer science',
          question_1: 'What is ML?',
          answer_1: 'A subset of AI'
        }
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('What is ML?'))
      expect(result).not.toEqual(expect.stringContaining('What is AI?'))
    })

    test('Should redirect to view page after saving', async () => {
      nock(evaluationUrl)
        .put('/truth-sources/ts_abc123/question-answers')
        .reply(200, { id: 'ts_abc123' })

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/truth/ts_abc123',
        payload: {
          action: 'save',
          count: '1',
          dataset_id: 'kg_1',
          question_0: 'What is AI?',
          answer_0: 'A field of computer science'
        }
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_SEE_OTHER)
      expect(headers.location).toBe('/truth/ts_abc123')
    })

    test('Should return 500 error page when save backend returns 500', async () => {
      nock(evaluationUrl)
        .put('/truth-sources/ts_abc123/question-answers')
        .reply(500, 'Internal Server Error')

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/truth/ts_abc123',
        payload: {
          action: 'save',
          count: '1',
          dataset_id: 'kg_1',
          question_0: 'What is AI?',
          answer_0: 'A field of computer science'
        }
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })
  })
})
