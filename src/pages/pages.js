import { manageRouter } from './group/router.js'

const pageRouter = {
  plugin: {
    name: 'pageRouter',
    async register (server) {
      await server.register([
        manageRouter
      ])
    }
  }
}

export {
  pageRouter
}
