import Joi from '@hapi/joi'

import * as manageController from './controller.js'

const routes = [
  {
    method: 'GET',
    path: '/group/add_group',
    handler: manageController.getAddGroupForm
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
    handler: manageController.updateGroup
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
