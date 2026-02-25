import path from 'node:path'
import fs from 'node:fs'

import hapiVision from '@hapi/vision'
import nunjucks from 'nunjucks'

import { config } from '../../config/config.js'

const nunjucksEnvironment = nunjucks.configure(
  [
    'node_modules/govuk-frontend/dist',
    path.join(config.get('root'), './src/pages')
  ],
  {
    autoescape: true,
    throwOnUndefined: false,
    trimBlocks: true,
    lstripBlocks: true
  }
)

const assetPath = config.get('assetPath')

const manifestPath = path.join(
  config.get('root'),
  '.public/assets-manifest.json'
)

const webpackManifest = JSON.parse(
  fs.readFileSync(manifestPath, 'utf8')
)

const viewPlugin = {
  plugin: hapiVision,
  options: {
    engines: {
      njk: {
        compile (src, options) {
          const template = nunjucks.compile(src, options.environment)

          return (context) => template.render(context)
        }
      }
    },
    compileOptions: {
      environment: nunjucksEnvironment
    },
    relativeTo: config.get('root'),
    path: 'src/pages',
    isCached: config.get('env') === 'production',
    context: {
      assetPath: `${assetPath}/assets`,
      getAssetPath (asset) {
        const webpackAsset = webpackManifest?.[asset]

        return `${assetPath}/${webpackAsset ?? asset}`
      },
      serviceName: config.get('serviceName')
    }
  }
}

export {
  viewPlugin
}
