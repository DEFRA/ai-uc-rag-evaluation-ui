import Boom from '@hapi/boom'

import { config } from '../../config/config.js'

async function createGroup (name, owner, description) {
  const backendRagServer = config.get('backend_rag_service')
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

export {
  createGroup
}
