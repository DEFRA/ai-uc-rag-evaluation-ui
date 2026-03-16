import * as evaluationController from './controller.js'

const routes = [
  {
    method: 'GET',
    path: '/evaluation',
    handler: evaluationController.listEvaluationRuns
  },
  {
    method: 'GET',
    path: '/evaluation/new',
    handler: evaluationController.getEvaluationForm
  },
  {
    method: 'POST',
    path: '/evaluation/new',
    handler: evaluationController.submitEvaluation
  },
  {
    method: 'GET',
    path: '/evaluation/{runId}',
    handler: evaluationController.getEvaluationResult
  }
]

const evaluationRouter = {
  plugin: {
    name: 'evaluationRouter',
    register (server) {
      server.route(routes)
    }
  }
}

export {
  evaluationRouter
}
