import Joi from '@hapi/joi'

import * as groupsController from './controller.js'

const routes = [
  {
    method: 'GET',
    path: '/',
    handler: groupsController.getGroupsPage
  },
  {
    method: 'GET',
    path: '/group',
    handler: groupsController.getGroupsPage
  },
  {
    method: 'GET',
    path: '/group/{groupId}',
    handler: groupsController.getGroupPage
  },
  {
    method: 'GET',
    path: '/group/{groupId}/add_source',
    handler: groupsController.getAddSourceForm
  },
  {
    method: 'POST',
    path: '/group/{groupId}',
    options: {
      validate: {
        payload: Joi.object({
          name: Joi.string().required(),
          type: Joi.string().valid('BLOB', 'PRECHUNKED_BLOB').required(),
          location: Joi.string().required()
        }),
        failAction: groupsController.failAddSource
      }
    },
    handler: groupsController.addSource
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
