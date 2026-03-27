import { statusCodes } from '../../../constants/status-codes.js'
import * as service from '../../../truth/truth-service.js'
import { getGroups } from '../../group/service.js'

const templatePath = 'truth/create/page.njk'

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

async function getTruthCreateForm (_request, h) {
  const groups = await getGroups()

  return h.view(templatePath, {
    groups,
    datasetId: '',
    questionAnswers: [{ question: '', answer: '' }]
  }).code(statusCodes.HTTP_STATUS_OK)
}

function handleAdd (h, { groups, datasetId, questionAnswers }) {
  questionAnswers.push({ question: '', answer: '' })
  return h.view(templatePath, { groups, datasetId, questionAnswers }).code(statusCodes.HTTP_STATUS_OK)
}

async function handleSubmit (h, { groups, datasetId, questionAnswers }) {
  if (!datasetId) {
    return h.view(templatePath, {
      groups,
      datasetId,
      questionAnswers,
      error: 'Dataset ID is required.'
    }).code(statusCodes.HTTP_STATUS_BAD_REQUEST)
  }

  const nonEmpty = questionAnswers.filter(qa => qa.question || qa.answer)
  const result = await service.createTruthSource({ dataset_id: datasetId, question_answers: nonEmpty })
  return h.redirect(`/truth/${result.id}`).code(statusCodes.HTTP_STATUS_SEE_OTHER)
}

function handleShow (h, { groups, datasetId, questionAnswers }) {
  return h.view(templatePath, { groups, datasetId, questionAnswers }).code(statusCodes.HTTP_STATUS_OK)
}

const actions = { add: handleAdd, submit: handleSubmit }

async function submitTruthCreateForm (request, h) {
  const payload = request.payload
  const context = {
    groups: await getGroups(),
    datasetId: payload.dataset_id || '',
    questionAnswers: buildQuestionAnswers(payload, Number.parseInt(payload.count, 10))
  }

  const handler = actions[payload.action] ?? handleShow
  return handler(h, context)
}

export {
  getTruthCreateForm,
  submitTruthCreateForm
}
