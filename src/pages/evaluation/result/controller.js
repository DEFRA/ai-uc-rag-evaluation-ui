import { statusCodes } from '../../../constants/status-codes.js'
import * as service from '../../../rag-evaluation/evaluation-service.js'

async function getEvaluationResult (request, h) {
  const { runId } = request.params

  const run = await service.getEvaluationRun(runId)

  return h.view('evaluation/result/page.njk', { run })
    .code(statusCodes.HTTP_STATUS_OK)
}

export {
  getEvaluationResult
}
