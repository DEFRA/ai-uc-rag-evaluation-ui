import * as listController from './list/controller.js'
import * as groupController from './run/select-group/controller.js'
import * as configureController from './run/select-evaluation-config/controller.js'
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
    handler: groupController.getGroupForm
  },
  {
    method: 'POST',
    path: '/evaluation/run',
    handler: groupController.submitGroup
  },
  {
    method: 'GET',
    path: '/evaluation/run/{groupId}',
    handler: configureController.getConfigureForm
  },
  {
    method: 'POST',
    path: '/evaluation/run/{groupId}',
    handler: configureController.submitConfigure
  },
  {
    method: 'GET',
    path: '/evaluation/{runId}',
    handler: resultController.getEvaluationResult
  },
  {
    method: 'GET',
    path: '/evaluation/{runId}/download',
    handler: resultController.downloadEvaluationResult
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
