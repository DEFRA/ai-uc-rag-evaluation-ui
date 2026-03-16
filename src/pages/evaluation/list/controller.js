import { statusCodes } from '../../../constants/status-codes.js'
import * as service from '../../../rag-evaluation/evaluation-service.js'

async function listEvaluationRuns (_request, h) {
  const { runs } = await service.listEvaluationRuns()

  return h.view('evaluation/list/page.njk', { runs })
    .code(statusCodes.HTTP_STATUS_OK)
}

export {
  listEvaluationRuns
}
