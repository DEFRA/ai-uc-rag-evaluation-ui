import Boom from '@hapi/boom'

import { config } from '../../config/config.js'

const backendRagServer = config.get('backend_rag_service')

async function getGroups () {
  const response = await fetch(`${backendRagServer}/knowledge/groups`)

  if (!response.ok) {
    const errorMessage = await response.text()
    console.error(`Failed to fetch groups with status ${response.status}: ${errorMessage}`)
    throw Boom.badImplementation()
  }

  return response.json()
}

async function createGroup (name, owner, description) {
  const response = await fetch(backendRagServer + '/knowledge/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, owner, description, sources: [] })
  })

  if (!response.ok) {
    const errorMessage = await response.text()
    console.error(`Backend request failed with status ${response.status}: ${errorMessage}`)
    throw Boom.badImplementation()
  }
  return response.json()
}

async function getGroup (groupId) {
  const response = await fetch(`${backendRagServer}/knowledge/groups/${groupId}`)

  if (!response.ok) {
    const errorMessage = await response.text()
    console.error(`Failed to fetch group ${groupId} with status ${response.status}: ${errorMessage}`)
    throw Boom.badImplementation()
  }

  return response.json()
}

async function initiateUpload (groupId, correlationId) {
  console.log(`Redirect url set to /group/${groupId}/add_source?correlation_id=${correlationId}`)

  const initiateResponse = await fetch(`${backendRagServer}/upload-initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      redirect: `/group/${groupId}/add_source?correlation_id=${correlationId}`,
      groupId
    })
  })

  if (!initiateResponse.ok) {
    const errorMessage = await initiateResponse.text()
    console.error(`Initiate upload failed with ${initiateResponse.status}: ${errorMessage}`)
    throw Boom.badImplementation()
  }

  return initiateResponse.json()
}

async function getUploadStatus (initiateResponse) {
  console.info(`Getting status for ${initiateResponse.statusUrl}`)
  const response = await fetch(initiateResponse.statusUrl)

  console.log('Got response')
  const responseJson = await response.json()

  if (!response.ok) {
    const errorMessage = await response.text()
    console.error(`Failed to get upload status with ${response.status}: ${errorMessage}`)
    throw Boom.badImplementation()
  }

  return responseJson
}

async function addSource (groupId, name, type, location) {
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
}

export {
  getGroups,
  createGroup,
  getUploadStatus,
  getGroup,
  initiateUpload,
  addSource
}
