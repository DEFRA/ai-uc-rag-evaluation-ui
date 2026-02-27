import { statusCodes } from '../../constants/status-codes.js'
import { createGroup } from './service.js'

function getAddGroupForm (_request, h) {
  return h.view('group/create-group-page.njk')
    .code(statusCodes.HTTP_STATUS_OK)
}

async function updateGroup (request, h) {
  const { name, owner, description } = request.payload

  const group = await createGroup(name, owner, description)

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

export {
  failCreateGroup,
  getAddGroupForm,
  updateGroup
}
