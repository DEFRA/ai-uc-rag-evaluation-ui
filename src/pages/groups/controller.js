import Boom from '@hapi/boom'

import { config } from '../../config/config.js'
import { statusCodes } from '../../constants/status-codes.js'

async function getGroupsPage (_request, h) {
  const backendRagServer = config.get('backend_rag_service')
  const response = await fetch(`${backendRagServer}/knowledge/groups`)

  if (!response.ok) {
    const errorMessage = await response.text()
    console.error(`Failed to fetch groups with status ${response.status}: ${errorMessage}`)
    throw Boom.badImplementation()
  }

  const groups = await response.json()

  return h.view('groups/page.njk', { groups })
    .code(statusCodes.HTTP_STATUS_OK)
}

async function getGroupPage (request, h) {
  const { groupId } = request.params
  const backendRagServer = config.get('backend_rag_service')
  const response = await fetch(`${backendRagServer}/knowledge/groups/${groupId}`)

  if (!response.ok) {
    const errorMessage = await response.text()
    console.error(`Failed to fetch group ${groupId} with status ${response.status}: ${errorMessage}`)
    throw Boom.badImplementation()
  }

  const group = await response.json()

  return h.view('groups/group.njk', { group })
    .code(statusCodes.HTTP_STATUS_OK)
}

function getAddSourceForm (request, h) {
  const { groupId } = request.params
  return h.view('groups/add_source.njk', { groupId })
    .code(statusCodes.HTTP_STATUS_OK)
}

function failAddSource (request, h, err) {
  const { groupId } = request.params
  const errors = Object.fromEntries(
    err.details.map(({ path, message }) => [path[0], message])
  )
  return h.view('groups/add_source.njk', {
    groupId,
    errors,
    values: request.payload
  }).code(statusCodes.HTTP_STATUS_BAD_REQUEST).takeover()
}

async function addSource (request, h) {
  const { groupId } = request.params
  const { name, type, location } = request.payload

  const backendRagServer = config.get('backend_rag_service')
  const response = await fetch(`${backendRagServer}/knowledge/groups/${groupId}/sources`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type, location })
  })

  if (!response.ok) {
    const errorMessage = await response.text()
    console.error(`Failed to add source with status ${response.status}: ${errorMessage}`)
    throw Boom.badImplementation()
  }

  return h.redirect(`/groups/${groupId}`).code(statusCodes.HTTP_STATUS_SEE_OTHER)
}

export {
  getGroupsPage,
  getGroupPage,
  getAddSourceForm,
  failAddSource,
  addSource
}
