import { statusCodes } from '../../constants/status-codes.js'
import * as service from './service.js'

async function getGroupsPage (_request, h) {
  const groups = await service.getGroups()

  return h.view('group/page.njk', { groups })
    .code(statusCodes.HTTP_STATUS_OK)
}

function getAddGroupForm (_request, h) {
  return h.view('group/create-group-page.njk')
    .code(statusCodes.HTTP_STATUS_OK)
}

async function createGroup (request, h) {
  const { name, owner, description } = request.payload

  const group = await service.createGroup(name, owner, description)

  console.info(`Created group ${name} id ${group.groupId}`)

  return h.redirect(`/group/${group.groupId}`).code(statusCodes.HTTP_STATUS_SEE_OTHER)
}

function failCreateGroup (request, h, err) {
  const errors = Object.fromEntries(
    err.details.map(({ path, message }) => [path[0], message])
  )
  return h.view('group/create-group-page.njk', {
    errors,
    values: request.payload
  }).code(statusCodes.HTTP_STATUS_BAD_REQUEST).takeover()
}

async function getGroup (request, h) {
  const { groupId } = request.params

  const [group, snapshots] = await Promise.all([
    service.getGroup(groupId),
    service.getSnapshots(groupId)
  ])

  return h.view('group/group.njk', { group, snapshots })
    .code(statusCodes.HTTP_STATUS_OK)
}

async function getUploadSourceForm (request, h) {
  const { groupId } = request.params
  const correlationId = crypto.randomUUID()
  const initiateResponse = await service.initiateUpload(groupId, correlationId)

  request.yar.set(correlationId, initiateResponse)

  return h.view('group/source_upload_file.njk', { groupId, uploadUrl: initiateResponse.uploadUrl })
    .code(statusCodes.HTTP_STATUS_OK)
}

async function getAddSourceForm (request, h) {
  const { groupId } = request.params
  const { correlation_id: correlationId } = request.query
  const initiateResponse = request.yar.get(correlationId)
  const uploadResponse = await service.getUploadStatus(initiateResponse)

  const location = `${initiateResponse.uploadId}/${uploadResponse.form.file.fileId}`

  return h.view('group/source_add_details.njk', { groupId, values: { location } })
    .code(statusCodes.HTTP_STATUS_OK)
}

function failAddSource (request, h, err) {
  const { groupId } = request.params
  const errors = Object.fromEntries(
    err.details.map(({ path, message }) => [path[0], message])
  )

  return h.view('group/source_add_details.njk', {
    groupId,
    errors,
    values: request.payload,
  }).code(statusCodes.HTTP_STATUS_BAD_REQUEST).takeover()
}

async function addSource (request, h) {
  const { groupId } = request.params
  const { name, type, location } = request.payload

  await service.addSource(groupId, name, type, location)

  return h.redirect(`/group/${groupId}`).code(statusCodes.HTTP_STATUS_SEE_OTHER)
}

async function ingestGroup (request, h) {
  const { groupId } = request.params

  await service.ingestGroup(groupId)

  return h.redirect('/').code(statusCodes.HTTP_STATUS_SEE_OTHER)
}

function failQueryGroup (request, h, err) {
  const { groupId } = request.params
  const errors = Object.fromEntries(
    err.details.map(({ path, message }) => [path[0], message])
  )

  return h.view('group/query.njk', {
    groupId,
    query: request.payload?.query,
    maxResults: request.payload?.maxResults,
    errors
  }).code(statusCodes.HTTP_STATUS_BAD_REQUEST).takeover()
}

function getQueryPage (request, h) {
  const { groupId } = request.params

  return h.view('group/query.njk', { groupId })
    .code(statusCodes.HTTP_STATUS_OK)
}

async function queryGroup (request, h) {
  const { groupId } = request.params
  const { query, maxResults } = request.payload

  const results = await service.querySnapshot(groupId, query, maxResults)

  return h.view('group/query.njk', { groupId, query, maxResults, results })
    .code(statusCodes.HTTP_STATUS_OK)
}

async function activateSnapshot (request, h) {
  const { snapshotId } = request.params

  await service.activateSnapshot(snapshotId)

  return h.redirect('/').code(statusCodes.HTTP_STATUS_SEE_OTHER)
}

export {
  failCreateGroup,
  getAddGroupForm,
  createGroup,
  getGroupsPage,
  getGroup,
  getUploadSourceForm,
  getAddSourceForm,
  failAddSource,
  addSource,
  ingestGroup,
  activateSnapshot,
  getQueryPage,
  queryGroup,
  failQueryGroup
}
