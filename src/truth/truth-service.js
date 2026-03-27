import Boom from '@hapi/boom'

import { config } from '../config/config.js'

const evaluationService = config.get('evaluation_service')

async function listTruthSources () {
  const response = await fetch(`${evaluationService}/truth-sources`)

  if (!response.ok) {
    const errorMessage = await response.text()
    console.error(`Failed to list truth sources with status ${response.status}: ${errorMessage}`)
    throw Boom.badImplementation()
  }

  return response.json()
}

async function createTruthSource (body) {
  const response = await fetch(`${evaluationService}/truth-sources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errorMessage = await response.text()
    console.error(`Failed to create truth source with status ${response.status}: ${errorMessage}`)
    throw Boom.badImplementation()
  }

  return response.json()
}

async function getTruthSource (sourceId) {
  const response = await fetch(`${evaluationService}/truth-sources/${sourceId}`)

  if (!response.ok) {
    const errorMessage = await response.text()
    console.error(`Failed to fetch truth source ${sourceId} with status ${response.status}: ${errorMessage}`)
    throw Boom.badImplementation()
  }

  return response.json()
}

async function updateQuestionAnswers (sourceId, questionAnswers) {
  const response = await fetch(`${evaluationService}/truth-sources/${sourceId}/question-answers`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question_answers: questionAnswers })
  })

  if (!response.ok) {
    const errorMessage = await response.text()
    console.error(`Failed to update question answers for ${sourceId} with status ${response.status}: ${errorMessage}`)
    throw Boom.badImplementation()
  }

  return response.json()
}

export {
  listTruthSources,
  createTruthSource,
  getTruthSource,
  updateQuestionAnswers
}
