import { statusCodes } from '../../../constants/status-codes.js'
import * as service from '../../../truth/truth-service.js'

async function listTruthSources (_request, h) {
  const { sources } = await service.listTruthSources()

  return h.view('truth/list/page.njk', { sources })
    .code(statusCodes.HTTP_STATUS_OK)
}

export {
  listTruthSources
}
