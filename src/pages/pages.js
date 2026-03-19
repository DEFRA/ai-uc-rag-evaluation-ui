import { manageRouter } from './group/router.js'
import { evaluationRouter } from './evaluation/router.js'
import { truthRouter } from './truth/router.js'

const pageRouter = {
  plugin: {
    name: 'pageRouter',
    async register (server) {
      await server.register([
        manageRouter,
        evaluationRouter,
        truthRouter
      ])
    }
  }
}

export {
  pageRouter
}
