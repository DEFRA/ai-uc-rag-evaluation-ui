import * as homeController from './controller.js'

const routes = [
  {
    method: 'GET',
    path: '/',
    handler: homeController.getHomepage
  }
]

const homeRouter = {
  plugin: {
    name: 'homeRouter',
    register (server) {
      server.route(routes)
    }
  }
}

export {
  homeRouter
}
