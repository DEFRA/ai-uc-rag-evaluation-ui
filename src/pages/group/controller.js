import Boom from '@hapi/boom'
import { fetch } from 'undici'

import { statusCodes } from '../../constants/status-codes.js'
import { config } from '../../config/config.js'

function getAddGroupForm (_request, h) {
  return h.view('group/create_group_page.njk')
    .code(statusCodes.HTTP_STATUS_OK)
}

async function updateGroup (request, h) {
  const { name, owner, description } = request.payload

  // We need to pass at least one source to the create endpoint due to schema validation (min_items=1)
  const sources = [{
    name: 'AI Opportunities Action Plan',
    type: 'PRECHUNKED_BLOB',
    location: 's3://placeholder',
  }]
  const backendRagServer = config.get('backend_rag_service')
  const response = await fetch(backendRagServer + '/knowledge/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, owner, description, sources })
  })

  if (!response.ok) {
    const errorMessage = await response.text()
    console.error(`Backend request failed with status ${response.status}: ${errorMessage}`)
    throw Boom.badImplementation()
  }
  const group = await response.json()
  console.info(`Created group ${name} id ${group.groupId}`)

  return h.redirect(`/group/${group.groupId}`).code(statusCodes.HTTP_STATUS_SEE_OTHER)
}

function failCreateGroup (request, h, err) {
  const errors = Object.fromEntries(
    err.details.map(({ path, message }) => [path[0], message])
  )
  return h.view('group/create_group_page.njk', {
    errors,
    values: request.payload
  }).code(statusCodes.HTTP_STATUS_BAD_REQUEST).takeover()
}

function getGroupCreatedPage (request, h) {
  const { groupId } = request.params
  return h.view('group/group_created_page.njk', { groupId })
    .code(statusCodes.HTTP_STATUS_OK)
}

export {
  failCreateGroup,
  getAddGroupForm,
  updateGroup,
  getGroupCreatedPage
}
