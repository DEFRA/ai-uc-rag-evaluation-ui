import * as listController from './list/controller.js'
import * as createController from './create/controller.js'
import * as viewController from './view/controller.js'

const routes = [
  {
    method: 'GET',
    path: '/truth',
    handler: listController.listTruthSources
  },
  {
    method: 'GET',
    path: '/truth/create',
    handler: createController.getTruthCreateForm
  },
  {
    method: 'POST',
    path: '/truth/create',
    handler: createController.submitTruthCreateForm
  },
  {
    method: 'GET',
    path: '/truth/{sourceId}',
    handler: viewController.getTruthSource
  },
  {
    method: 'POST',
    path: '/truth/{sourceId}',
    handler: viewController.submitTruthView
  }
]

const truthRouter = {
  plugin: {
    name: 'truthRouter',
    register (server) {
      server.route(routes)
    }
  }
}

export {
  truthRouter
}
