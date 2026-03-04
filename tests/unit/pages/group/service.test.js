import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  addSource,
  createGroup,
  getGroup,
  getGroups,
  getSnapshots,
  getUploadStatus,
  ingestGroup,
  initiateUpload
} from '../../../../src/pages/group/service.js'

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

describe('getGroups', () => {
  test('should return groups on success', async () => {
    const groups = [{ groupId: 'kg_1', name: 'Group 1' }]
    mockFetch.mockResolvedValue(mockResponse(200, groups))

    const result = await getGroups()

    expect(result).toEqual(groups)
  })

  test('should throw on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse(500, 'error'))

    await expect(getGroups()).rejects.toThrow()
  })
})

describe('createGroup', () => {
  test('should return created group on success', async () => {
    const group = { groupId: 'kg_1', name: 'Test', owner: 'owner', description: 'desc' }
    mockFetch.mockResolvedValue(mockResponse(200, group))

    const result = await createGroup('Test', 'owner', 'desc')

    expect(result).toEqual(group)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/knowledge/groups'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Test', owner: 'owner', description: 'desc', sources: [] })
      })
    )
  })

  test('should throw on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse(500, 'error'))

    await expect(createGroup('Test', 'owner', 'desc')).rejects.toThrow()
  })
})

describe('getGroup', () => {
  test('should return group on success', async () => {
    const group = { groupId: 'kg_1', name: 'Test' }
    mockFetch.mockResolvedValue(mockResponse(200, group))

    const result = await getGroup('kg_1')

    expect(result).toEqual(group)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/knowledge/groups/kg_1'))
  })

  test('should throw on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse(500, 'error'))

    await expect(getGroup('kg_1')).rejects.toThrow()
  })
})

describe('getSnapshots', () => {
  test('should return snapshots on success', async () => {
    const snapshots = [{ snapshot_id: 'kg_1_v1', group_id: 'kg_1', version: 1, created_at: '2026-03-04T16:26:09.940000', ingestion_status: 'completed' }]
    mockFetch.mockResolvedValue(mockResponse(200, snapshots))

    const result = await getSnapshots('kg_1')

    expect(result).toEqual(snapshots)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/knowledge/groups/kg_1/snapshots'))
  })

  test('should throw on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse(500, 'error'))

    await expect(getSnapshots('kg_1')).rejects.toThrow()
  })
})

describe('initiateUpload', () => {
  test('should return initiate response on success', async () => {
    const initiateData = {
      uploadId: 'upload_1',
      uploadUrl: 'http://uploader/upload',
      statusUrl: 'http://uploader/status/1'
    }
    mockFetch.mockResolvedValue(mockResponse(200, initiateData))

    const result = await initiateUpload('kg_1', 'corr-123')

    expect(result).toEqual(initiateData)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/upload-initiate'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('corr-123')
      })
    )
  })

  test('should include groupId and redirect in request body', async () => {
    mockFetch.mockResolvedValue(mockResponse(200, {}))

    await initiateUpload('kg_1', 'corr-123', 'http://localhost:3000')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.groupId).toBe('kg_1')
    expect(body.redirect).toBe('/group/kg_1/add_source?correlation_id=corr-123')
  })

  test('should throw on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse(500, 'error'))

    await expect(initiateUpload('kg_1', 'corr-123', 'http://localhost:3000')).rejects.toThrow()
  })
})

describe('getUploadStatus', () => {
  const initiateResponse = { statusUrl: 'http://uploader/status/1' }

  test('should return upload status on success', async () => {
    const statusData = { form: { file: { fileId: 'file_1' } } }
    mockFetch.mockResolvedValue(mockResponse(200, statusData))

    const result = await getUploadStatus(initiateResponse)

    expect(result).toEqual(statusData)
    expect(mockFetch).toHaveBeenCalledWith('http://uploader/status/1')
  })

  test('should throw on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse(503, 'unavailable'))

    await expect(getUploadStatus(initiateResponse)).rejects.toThrow()
  })
})

describe('ingestGroup', () => {
  test('should call backend with correct method and url', async () => {
    mockFetch.mockResolvedValue(mockResponse(200, {}))

    await ingestGroup('kg_1')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/knowledge/groups/kg_1/ingest'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  test('should throw on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse(500, 'error'))

    await expect(ingestGroup('kg_1')).rejects.toThrow()
  })
})

describe('addSource', () => {
  test('should call backend with correct payload', async () => {
    mockFetch.mockResolvedValue(mockResponse(200, {}))

    await addSource('kg_1', 'My Source', 'BLOB', 's3://bucket/key')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/knowledge/groups/kg_1/sources'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'My Source', type: 'BLOB', location: 's3://bucket/key' })
      })
    )
  })

  test('should throw on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse(500, 'error'))

    await expect(addSource('kg_1', 'My Source', 'BLOB', 's3://bucket/key')).rejects.toThrow()
  })
})
