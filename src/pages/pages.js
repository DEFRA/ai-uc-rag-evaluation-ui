import { manageRouter } from './group/router.js'
import { evaluationRouter } from './evaluation/router.js'

const pageRouter = {
  plugin: {
    name: 'pageRouter',
    async register (server) {
      await server.register([
        manageRouter,
        evaluationRouter
      ])
    }
  }
}

export {
  pageRouter
}
