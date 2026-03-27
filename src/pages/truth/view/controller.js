import { statusCodes } from '../../../constants/status-codes.js'
import * as service from '../../../truth/truth-service.js'

const templatePath = 'truth/view/page.njk'

function buildQuestionAnswers (payload, count) {
  const pairs = []
  for (let i = 0; i < count; i++) {
    pairs.push({
      question: payload[`question_${i}`] || '',
      answer: payload[`answer_${i}`] || ''
    })
  }
  return pairs
}

async function getTruthSource (request, h) {
  const { sourceId } = request.params
  const source = await service.getTruthSource(sourceId)

  return h.view(templatePath, { source })
    .code(statusCodes.HTTP_STATUS_OK)
}

async function submitTruthView (request, h) {
  const { sourceId } = request.params
  const payload = request.payload
  const action = payload.action
  const count = Number.parseInt(payload.count, 10)
  let questionAnswers = buildQuestionAnswers(payload, count)

  if (action === 'add') {
    questionAnswers.push({ question: '', answer: '' })
    return h.view(templatePath, {
      source: { id: sourceId, dataset_id: payload.dataset_id, question_answers: questionAnswers },
      editing: true
    }).code(statusCodes.HTTP_STATUS_OK)
  }

  if (action?.startsWith('delete-')) {
    const index = Number.parseInt(action.replace('delete-', ''), 10)
    questionAnswers = questionAnswers.filter((_, i) => i !== index)
    return h.view(templatePath, {
      source: { id: sourceId, dataset_id: payload.dataset_id, question_answers: questionAnswers },
      editing: true
    }).code(statusCodes.HTTP_STATUS_OK)
  }

  if (action === 'save') {
    await service.updateQuestionAnswers(sourceId, questionAnswers)
    return h.redirect(`/truth/${sourceId}`).code(statusCodes.HTTP_STATUS_SEE_OTHER)
  }

  return h.redirect(`/truth/${sourceId}`).code(statusCodes.HTTP_STATUS_SEE_OTHER)
}

export {
  getTruthSource,
  submitTruthView
}
