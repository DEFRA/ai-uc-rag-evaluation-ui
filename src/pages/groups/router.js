import Joi from '@hapi/joi'

import * as groupsController from './controller.js'

const routes = [
  {
    method: 'GET',
    path: '/groups',
    handler: groupsController.getGroupsPage
  },
  {
    method: 'GET',
    path: '/groups/{groupId}/source/add',
    handler: groupsController.getAddSourceForm
  },
  {
    method: 'POST',
    path: '/groups/{groupId}/source',
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
