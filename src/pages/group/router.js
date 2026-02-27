import Joi from '@hapi/joi'

import * as groupController from './controller.js'

const routes = [
  {
    method: 'GET',
    path: '/',
    handler: groupController.getGroupsPage
  },
  {
    method: 'GET',
    path: '/group',
    handler: groupController.getGroupsPage
  },
  {
    method: 'GET',
    path: '/group/{groupId}',
    handler: groupController.getGroup
  },
  {
    method: 'GET',
    path: '/group/{groupId}/add_source',
    handler: groupController.getAddSourceForm
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
        failAction: groupController.failAddSource
      }
    },
    handler: groupController.addSource
  },
  {
    method: 'GET',
    path: '/group/add_group',
    handler: groupController.getAddGroupForm
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
        failAction: groupController.failCreateGroup
      }
    },
    handler: groupController.createGroup
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
