import * as listController from './list/controller.js'
import * as runController from './run/controller.js'
import * as resultController from './result/controller.js'

const routes = [
  {
    method: 'GET',
    path: '/evaluation',
    handler: listController.listEvaluationRuns
  },
  {
    method: 'GET',
    path: '/evaluation/run',
    handler: runController.getEvaluationForm
  },
  {
    method: 'POST',
    path: '/evaluation/run',
    handler: runController.submitEvaluation
  },
  {
    method: 'GET',
    path: '/evaluation/{runId}',
    handler: resultController.getEvaluationResult
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
