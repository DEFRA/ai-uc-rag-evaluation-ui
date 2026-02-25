import Joi from '@hapi/joi'

import * as manageController from './controller.js'

const routes = [
  {
    method: 'GET',
    path: '/group',
    handler: manageController.getManagePage
  },
  {
    method: 'POST',
    path: '/group',
    options: {
      validate: {
        payload: Joi.object({
          name: Joi.string().required(),
          owner: Joi.string().required(),
          description: Joi.string().required()
        }),
        failAction: manageController.failCreateGroup
      }
    },
    handler: manageController.updateManagePage
  },
  {
    method: 'GET',
    path: '/group/{groupId}',
    handler: manageController.getGroupCreatedPage
  }
]

const manageRouter = {
  plugin: {
    name: 'manageRouter',
    register (server) {
      server.route(routes)
    }
  }
}

export {
  manageRouter
}
