import { statusCodes } from '../../../constants/status-codes.js'
import * as service from '../../../rag-evaluation/evaluation-service.js'

const defaultBody = JSON.stringify({
  group_id: '',
  snapshot_id: '',
  queries: [
    { query: '', expected_answer: '' }
  ],
  rubrics: [''],
  models: ['']
}, null, 2)

function getEvaluationForm (_request, h) {
  return h.view('evaluation/run/page.njk', { defaultBody })
    .code(statusCodes.HTTP_STATUS_OK)
}

async function submitEvaluation (request, h) {
  const { body } = request.payload

  let parsed
  try {
    parsed = JSON.parse(body)
  } catch (err) {
    console.error('Failed to parse evaluation request body:', err.message)
    return h.view('evaluation/run/page.njk', {
      defaultBody: body,
      error: 'Invalid JSON — please check your request body.'
    }).code(statusCodes.HTTP_STATUS_BAD_REQUEST)
  }

  const result = await service.startEvaluation(parsed)

  return h.redirect(`/evaluation/${result.run_id}`).code(statusCodes.HTTP_STATUS_SEE_OTHER)
}

export {
  getEvaluationForm,
  submitEvaluation
}
