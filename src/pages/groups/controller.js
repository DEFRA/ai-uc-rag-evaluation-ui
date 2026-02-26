import Boom from '@hapi/boom'
import { fetch } from 'undici'

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

export {
  getGroupsPage
}
