import { statusCodes } from '../../../../constants/status-codes.js'
import { getGroups } from '../../../group/service.js'

const templatePath = 'evaluation/run/select-group/page.njk'

async function getGroupForm (_request, h) {
  const groups = await getGroups()
  return h.view(templatePath, { groups, errors: {} }).code(statusCodes.HTTP_STATUS_OK)
}

async function submitGroup (request, h) {
  const { group_id: groupId } = request.payload

  if (!groupId) {
    const groups = await getGroups()
    return h.view(templatePath, {
      groups,
      errors: { groupId: 'Select a group' }
    }).code(statusCodes.HTTP_STATUS_BAD_REQUEST)
  }

  return h.redirect(`/evaluation/run/${groupId}`).code(statusCodes.HTTP_STATUS_SEE_OTHER)
}

export {
  getGroupForm,
  submitGroup
}
