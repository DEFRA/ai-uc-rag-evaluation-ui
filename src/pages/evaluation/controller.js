import { statusCodes } from '../../constants/status-codes.js'
import * as service from './service.js'

const defaultBody = JSON.stringify({
  group_id: '',
  snapshot_id: '',
  queries: [
    { query: '', expected_answer: '' }
  ],
  rubrics: [''],
  models: ['']
}, null, 2)

async function listEvaluationRuns (_request, h) {
  const { runs } = await service.listEvaluationRuns()

  return h.view('evaluation/list.njk', { runs })
    .code(statusCodes.HTTP_STATUS_OK)
}

function getEvaluationForm (_request, h) {
  return h.view('evaluation/run.njk', { defaultBody })
    .code(statusCodes.HTTP_STATUS_OK)
}

async function submitEvaluation (request, h) {
  const { body } = request.payload

  let parsed
  try {
    parsed = JSON.parse(body)
  } catch (_err) {
    return h.view('evaluation/run.njk', {
      defaultBody: body,
      error: 'Invalid JSON — please check your request body.'
    }).code(statusCodes.HTTP_STATUS_BAD_REQUEST)
  }

  const result = await service.startEvaluation(parsed)

  return h.redirect(`/evaluation/${result.run_id}`).code(statusCodes.HTTP_STATUS_SEE_OTHER)
}

async function getEvaluationResult (request, h) {
  const { runId } = request.params

  const run = await service.getEvaluationRun(runId)

  return h.view('evaluation/result.njk', { run })
    .code(statusCodes.HTTP_STATUS_OK)
}

export {
  listEvaluationRuns,
  getEvaluationForm,
  submitEvaluation,
  getEvaluationResult
}
