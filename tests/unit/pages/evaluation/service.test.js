import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  getEvaluationRun,
  listEvaluationRuns,
  startEvaluation
} from '../../../../src/pages/evaluation/service.js'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockResponse (status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body))
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listEvaluationRuns', () => {
  test('should return runs on success', async () => {
    const runs = {
      runs: [
        { run_id: 'run_1', status: 'completed' },
        { run_id: 'run_2', status: 'in_progress' }
      ]
    }
    mockFetch.mockResolvedValue(mockResponse(200, runs))

    const result = await listEvaluationRuns()

    expect(result).toEqual(runs)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/evaluation'))
  })

  test('should throw on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse(500, 'error'))

    await expect(listEvaluationRuns()).rejects.toThrow()
  })
})

describe('startEvaluation', () => {
  const requestBody = {
    group_id: 'kg_1',
    snapshot_id: 'kg_1_v1',
    queries: [{ query: 'What is AI?', expected_answer: 'A field of computer science' }],
    rubrics: ['Score 0 to 1'],
    models: ['haiku_3']
  }

  test('should return run on success', async () => {
    const run = { run_id: 'run_1', status: 'accepted', ...requestBody, results: [] }
    mockFetch.mockResolvedValue(mockResponse(200, run))

    const result = await startEvaluation(requestBody)

    expect(result).toEqual(run)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/evaluation'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(requestBody)
      })
    )
  })

  test('should send Content-Type application/json', async () => {
    mockFetch.mockResolvedValue(mockResponse(200, {}))

    await startEvaluation(requestBody)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' }
      })
    )
  })

  test('should throw on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse(500, 'error'))

    await expect(startEvaluation(requestBody)).rejects.toThrow()
  })
})

describe('getEvaluationRun', () => {
  test('should return run on success', async () => {
    const run = {
      run_id: 'run_1',
      status: 'completed',
      group_id: 'kg_1',
      snapshot_id: 'kg_1_v1',
      queries: [],
      rubrics: [],
      models: ['haiku_3'],
      results: []
    }
    mockFetch.mockResolvedValue(mockResponse(200, run))

    const result = await getEvaluationRun('run_1')

    expect(result).toEqual(run)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/evaluation/run_1'))
  })

  test('should throw on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse(500, 'error'))

    await expect(getEvaluationRun('run_1')).rejects.toThrow()
  })
})
