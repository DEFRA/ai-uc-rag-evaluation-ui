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

  const group = await service.getGroup(groupId)

  return h.view('group/group.njk', { group })
    .code(statusCodes.HTTP_STATUS_OK)
}

function getAddSourceForm (request, h) {
  const { groupId } = request.params
  return h.view('group/add_source.njk', { groupId })
    .code(statusCodes.HTTP_STATUS_OK)
}

function failAddSource (request, h, err) {
  const { groupId } = request.params
  const errors = Object.fromEntries(
    err.details.map(({ path, message }) => [path[0], message])
  )
  return h.view('group/add_source.njk', {
    groupId,
    errors,
    values: request.payload
  }).code(statusCodes.HTTP_STATUS_BAD_REQUEST).takeover()
}

async function addSource (request, h) {
  const { groupId } = request.params
  const { name, type, location } = request.payload

  await service.addSource(groupId, name, type, location)

  return h.redirect(`/group/${groupId}`).code(statusCodes.HTTP_STATUS_SEE_OTHER)
}

export {
  failCreateGroup,
  getAddGroupForm,
  createGroup,
  getGroupsPage,
  getGroup,
  getAddSourceForm,
  failAddSource,
  addSource
}
