import { constants as statusCodes } from 'node:http2'

import nock from 'nock'

import { createServer } from '../../../../../src/server/server.js'

const evaluationUrl = 'http://localhost:9085'
const backendUrl = 'http://localhost:8085'

const groups = [
  { groupId: 'kg_1', title: 'Group One', description: 'First group', owner: 'owner' },
  { groupId: 'kg_2', title: 'Group Two', description: 'Second group', owner: 'owner' }
]

describe('#truthCreateController', () => {
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

  describe('GET /truth/create', () => {
    test('Should render the create form with groups as dropdown options', async () => {
      nock(backendUrl)
        .get('/knowledge/groups')
        .reply(200, groups)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/truth/create'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('Create Truth Data Source'))
      expect(result).toEqual(expect.stringContaining('kg_1'))
      expect(result).toEqual(expect.stringContaining('Group One'))
      expect(result).toEqual(expect.stringContaining('kg_2'))
      expect(result).toEqual(expect.stringContaining('question_0'))
      expect(result).toEqual(expect.stringContaining('answer_0'))
    })

    test('Should return 500 error page when groups backend returns 500', async () => {
      nock(backendUrl)
        .get('/knowledge/groups')
        .reply(500, 'Internal Server Error')

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/truth/create'
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toEqual(expect.stringContaining('Something went wrong'))
    })
  })

  describe('POST /truth/create', () => {
    test('Should add a new empty Q&A row when action is add', async () => {
      nock(backendUrl)
        .get('/knowledge/groups')
        .reply(200, groups)

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/truth/create',
        payload: {
          action: 'add',
          count: '1',
          dataset_id: 'kg_1',
          question_0: 'What is AI?',
          answer_0: 'A field of computer science'
        }
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_OK)
      expect(result).toEqual(expect.stringContaining('question_0'))
      expect(result).toEqual(expect.stringContaining('question_1'))
      expect(result).toEqual(expect.stringContaining('What is AI?'))
    })

    test('Should redirect to the view page on successful creation', async () => {
      nock(backendUrl)
        .get('/knowledge/groups')
        .reply(200, groups)

      nock(evaluationUrl)
        .post('/truth-sources')
        .reply(201, {
          id: 'ts_abc123',
          dataset_id: 'kg_1',
          question_answers: [{ question: 'What is AI?', answer: 'A field of computer science' }]
        })

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/truth/create',
        payload: {
          action: 'submit',
          count: '1',
          dataset_id: 'kg_1',
          question_0: 'What is AI?',
          answer_0: 'A field of computer science'
        }
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_SEE_OTHER)
      expect(headers.location).toBe('/truth/ts_abc123')
    })

    test('Should return 400 and show error when dataset ID is missing', async () => {
      nock(backendUrl)
        .get('/knowledge/groups')
        .reply(200, groups)

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/truth/create',
        payload: {
          action: 'submit',
          count: '1',
          dataset_id: '',
          question_0: 'What is AI?',
          answer_0: 'A field of computer science'
        }
      })

      expect(statusCode).toBe(statusCodes.HTTP_STATUS_BAD_REQUEST)
      expect(result).toEqual(expect.stringContaining('Dataset ID is required.'))
    })

    test('Should return 500 error page when backend returns 500', async () => {
      nock(backendUrl)
        .get('/knowledge/groups')
        .reply(200, groups)

      nock(evaluationUrl)
        .post('/truth-sources')
        .reply(500, 'Internal Server Error')

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/truth/create',
        payload: {
          action: 'submit',
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
