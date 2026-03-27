import { constants as httpStatus } from 'node:http2'

import nock from 'nock'

import { createServer } from '../../../../../../src/server/server.js'

const ragServiceUrl = 'http://localhost:8085'
const evaluationUrl = 'http://localhost:9085'

const groups = [{ groupId: 'group_1', title: 'Group One' }]
const snapshots = [{ snapshot_id: 'snap_1', version: 'v1', created_at: '2026-01-01', ingestion_status: 'completed' }]
const truthSources = { sources: [{ id: 'truth_1', dataset_id: 'group_1', url: '/truth-sources/truth_1' }] }

function mockBackends () {
  nock(ragServiceUrl).get('/knowledge/groups').reply(200, groups)
  nock(ragServiceUrl).get('/knowledge/groups/group_1/snapshots').reply(200, snapshots)
  nock(evaluationUrl).get('/truth-sources').reply(200, truthSources)
}

const validPayload = {
  rubric_count: '1',
  rubric_0: 'Score 0 to 1',
  snapshot_id: 'snap_1',
  truth_source_id: 'truth_1',
  models: 'model_1',
  action: 'submit'
}

describe('#selectEvaluationConfigController', () => {
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

  describe('GET /evaluation/run/{groupId}', () => {
    test('should render the configure form with snapshots and truth sources', async () => {
      mockBackends()

      const { statusCode, result } = await server.inject({
        method: 'GET',
        url: '/evaluation/run/group_1'
      })

      expect(statusCode).toBe(httpStatus.HTTP_STATUS_OK)
      expect(result).toContain('Configure Evaluation')
      expect(result).toContain('snap_1')
      expect(result).toContain('truth_1')
      expect(result).toContain('Rubric criteria')
    })
  })

  describe('POST /evaluation/run/{groupId}', () => {
    test('should add a rubric when action is add_rubric', async () => {
      mockBackends()

      const { statusCode, result } = await server.inject({
        method: 'POST',
        url: '/evaluation/run/group_1',
        payload: { rubric_count: '1', rubric_0: 'First rubric', action: 'add_rubric' }
      })

      expect(statusCode).toBe(httpStatus.HTTP_STATUS_OK)
      expect(result).toContain('First rubric')
      expect(result).toContain('Rubric 2')
    })

    test('should delete a rubric when action is delete_rubric_N', async () => {
      mockBackends()

      const { statusCode, result } = await server.inject({
        method: 'POST',
        url: '/evaluation/run/group_1',
        payload: {
          rubric_count: '2',
          rubric_0: 'Keep this',
          rubric_1: 'Delete this',
          action: 'delete_rubric_1'
        }
      })

      expect(statusCode).toBe(httpStatus.HTTP_STATUS_OK)
      expect(result).toContain('Keep this')
      expect(result).not.toContain('Delete this')
    })

    test('should return 400 with field errors when required fields are missing', async () => {
      mockBackends()

      const { statusCode, result } = await server.inject({
        method: 'POST',
        url: '/evaluation/run/group_1',
        payload: { rubric_count: '1', rubric_0: '', action: 'submit' }
      })

      expect(statusCode).toBe(httpStatus.HTTP_STATUS_BAD_REQUEST)
      expect(result).toContain('Select a snapshot')
      expect(result).toContain('Select a truth source')
      expect(result).toContain('Enter at least one rubric')
      expect(result).toContain('Select at least one model')
    })

    test('should redirect to the result page on successful submit', async () => {
      mockBackends()
      nock(evaluationUrl)
        .post('/evaluation')
        .reply(202, { run_id: 'run_abc123', status: 'accepted' })

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/evaluation/run/group_1',
        payload: validPayload
      })

      expect(statusCode).toBe(httpStatus.HTTP_STATUS_SEE_OTHER)
      expect(headers.location).toBe('/evaluation/run_abc123')
    })

    test('should return 500 when the evaluation backend returns an error', async () => {
      mockBackends()
      nock(evaluationUrl).post('/evaluation').reply(500, 'Internal Server Error')

      const { statusCode, result } = await server.inject({
        method: 'POST',
        url: '/evaluation/run/group_1',
        payload: validPayload
      })

      expect(statusCode).toBe(httpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      expect(result).toContain('Something went wrong')
    })
  })
})
