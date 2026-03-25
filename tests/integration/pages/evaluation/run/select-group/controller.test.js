import { constants as httpStatus } from 'node:http2'

import nock from 'nock'

import { createServer } from '../../../../../../src/server/server.js'

const ragServiceUrl = 'http://localhost:8085'

const groups = [
  { groupId: 'group_1', title: 'Group One' },
  { groupId: 'group_2', title: 'Group Two' }
]

describe('#selectGroupController', () => {
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
    test('should render the group selection form', async () => {
      nock(ragServiceUrl).get('/knowledge/groups').reply(200, groups)

      const { statusCode, result } = await server.inject({
        method: 'GET',
        url: '/evaluation/run'
      })

      expect(statusCode).toBe(httpStatus.HTTP_STATUS_OK)
      expect(result).toContain('Run Evaluation')
      expect(result).toContain('Group One')
      expect(result).toContain('Group Two')
      expect(result).toContain('Continue')
    })
  })

  describe('POST /evaluation/run', () => {
    test('should redirect to the configure page when a group is selected', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/evaluation/run',
        payload: { group_id: 'group_1' }
      })

      expect(statusCode).toBe(httpStatus.HTTP_STATUS_SEE_OTHER)
      expect(headers.location).toBe('/evaluation/run/group_1')
    })

    test('should return 400 and show an error when no group is selected', async () => {
      nock(ragServiceUrl).get('/knowledge/groups').reply(200, groups)

      const { statusCode, result } = await server.inject({
        method: 'POST',
        url: '/evaluation/run',
        payload: { group_id: '' }
      })

      expect(statusCode).toBe(httpStatus.HTTP_STATUS_BAD_REQUEST)
      expect(result).toContain('Select a group')
    })
  })
})
