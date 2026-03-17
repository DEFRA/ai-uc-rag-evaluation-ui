import Boom from '@hapi/boom'

import { config } from '../config/config.js'

const evaluationService = config.get('evaluation_service')

async function listEvaluationRuns () {
  const response = await fetch(`${evaluationService}/evaluation`)

  if (!response.ok) {
    const errorMessage = await response.text()
    console.error(`Failed to list evaluation runs with status ${response.status}: ${errorMessage}`)
    throw Boom.badImplementation()
  }

  return response.json()
}

async function startEvaluation (body) {
  const response = await fetch(`${evaluationService}/evaluation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errorMessage = await response.text()
    console.error(`Failed to start evaluation with status ${response.status}: ${errorMessage}`)
    throw Boom.badImplementation()
  }

  return response.json()
}

async function getEvaluationRun (runId) {
  const response = await fetch(`${evaluationService}/evaluation/${runId}`)

  if (!response.ok) {
    const errorMessage = await response.text()
    console.error(`Failed to fetch evaluation run ${runId} with status ${response.status}: ${errorMessage}`)
    throw Boom.badImplementation()
  }

  return response.json()
}

export {
  listEvaluationRuns,
  startEvaluation,
  getEvaluationRun
}
