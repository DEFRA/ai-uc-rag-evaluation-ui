import { homeRouter } from './home/router.js'
import { manageRouter } from './group/router.js'
import { groupsRouter } from './groups/router.js'

const pageRouter = {
  plugin: {
    name: 'pageRouter',
    async register (server) {
      await server.register([
        homeRouter,
        manageRouter,
        groupsRouter
      ])
    }
  }
}

export {
  pageRouter
}
