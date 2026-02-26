import * as groupsController from './controller.js'

const routes = [
  {
    method: 'GET',
    path: '/groups',
    handler: groupsController.getGroupsPage
  }
]

const groupsRouter = {
  plugin: {
    name: 'groupsRouter',
    register (server) {
      server.route(routes)
    }
  }
}

export {
  groupsRouter
}
