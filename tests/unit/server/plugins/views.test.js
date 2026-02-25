import { describe, test, expect, beforeEach, vi } from 'vitest'

const mockReadFileSync = vi.fn()
const mockNunjucksConfigure = vi.fn()
const mockNunjucksCompile = vi.fn()

vi.mock('node:fs', () => ({
  default: {
    readFileSync: mockReadFileSync
  }
}))

vi.mock('nunjucks', () => ({
  default: {
    configure: mockNunjucksConfigure,
    compile: mockNunjucksCompile
  }
}))

describe('views plugin', () => {
  beforeEach(() => {
    mockReadFileSync.mockReset()
    mockNunjucksConfigure.mockReset()
    mockNunjucksCompile.mockReset()
    vi.resetModules()
  })

  describe('Context configuration', () => {
    beforeEach(() => {
      mockReadFileSync.mockReturnValue(JSON.stringify({
        'application.js': 'javascripts/application.abc123.js',
        'stylesheets/application.scss': 'stylesheets/application.xyz789.css'
      }))

      mockNunjucksConfigure.mockReturnValue({})
    })

    test('Should provide correct context properties', async () => {
      const { viewPlugin } = await import('../../../../src/server/plugins/views.js')

      expect(viewPlugin.options.context).toEqual(
        expect.objectContaining({
          assetPath: '/public/assets',
          getAssetPath: expect.any(Function),
          serviceName: 'ai-uc-rag-evaluation-ui'
        })
      )
    })

    test('Should provide correct assetPath in context', async () => {
      const { viewPlugin } = await import('../../../../src/server/plugins/views.js')

      expect(viewPlugin.options.context.assetPath).toBe('/public/assets')
    })

    test('Should provide correct serviceName in context', async () => {
      const { viewPlugin } = await import('../../../../src/server/plugins/views.js')

      expect(viewPlugin.options.context.serviceName).toBe('ai-uc-rag-evaluation-ui')
    })
  })

  describe('Webpack manifest handling', () => {
    beforeEach(() => {
      mockNunjucksConfigure.mockReturnValue({})
    })

    test('Should read webpack manifest file', async () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({
        'application.js': 'javascripts/application.abc123.js'
      }))

      await import('../../../../src/server/plugins/views.js')

      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining('assets-manifest.json'),
        'utf8'
      )
    })

    test('Should parse webpack manifest JSON', async () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({
        'application.js': 'javascripts/application.abc123.js',
        'stylesheets/application.scss': 'stylesheets/application.xyz789.css'
      }))

      const { viewPlugin } = await import('../../../../src/server/plugins/views.js')

      // Test that getAssetPath uses the parsed manifest
      expect(viewPlugin.options.context.getAssetPath('application.js')).toBe(
        '/public/javascripts/application.abc123.js'
      )
    })
  })

  describe('getAssetPath function', () => {
    beforeEach(() => {
      mockNunjucksConfigure.mockReturnValue({})
    })

    test('Should return versioned asset path when asset exists in manifest', async () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({
        'application.js': 'javascripts/application.abc123.js',
        'stylesheets/application.scss': 'stylesheets/application.xyz789.css'
      }))

      const { viewPlugin } = await import('../../../../src/server/plugins/views.js')
      const { getAssetPath } = viewPlugin.options.context

      expect(getAssetPath('application.js')).toBe('/public/javascripts/application.abc123.js')
      expect(getAssetPath('stylesheets/application.scss')).toBe('/public/stylesheets/application.xyz789.css')
    })

    test('Should return original asset path when asset does not exist in manifest', async () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({
        'application.js': 'javascripts/application.abc123.js'
      }))

      const { viewPlugin } = await import('../../../../src/server/plugins/views.js')
      const { getAssetPath } = viewPlugin.options.context

      expect(getAssetPath('unknown-asset.png')).toBe('/public/unknown-asset.png')
    })

    test('Should handle empty manifest', async () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({}))

      const { viewPlugin } = await import('../../../../src/server/plugins/views.js')
      const { getAssetPath } = viewPlugin.options.context

      expect(getAssetPath('any-asset.js')).toBe('/public/any-asset.js')
    })
  })

  describe('Template compilation', () => {
    beforeEach(() => {
      mockReadFileSync.mockReturnValue(JSON.stringify({}))
      mockNunjucksConfigure.mockReturnValue({})
    })

    test('Should compile templates with nunjucks environment', async () => {
      const mockTemplate = { render: vi.fn().mockReturnValue('<html></html>') }
      mockNunjucksCompile.mockReturnValue(mockTemplate)

      const { viewPlugin } = await import('../../../../src/server/plugins/views.js')
      const { compile } = viewPlugin.options.engines.njk

      const mockEnvironment = {}
      const compiledTemplate = compile('<html>{{ title }}</html>', { environment: mockEnvironment })

      expect(mockNunjucksCompile).toHaveBeenCalledWith('<html>{{ title }}</html>', mockEnvironment)
      expect(compiledTemplate).toBeInstanceOf(Function)
    })

    test('Should render compiled template with context', async () => {
      const mockTemplate = { render: vi.fn().mockReturnValue('<html>Test</html>') }
      mockNunjucksCompile.mockReturnValue(mockTemplate)

      const { viewPlugin } = await import('../../../../src/server/plugins/views.js')
      const { compile } = viewPlugin.options.engines.njk

      const compiledTemplate = compile('<html>{{ title }}</html>', { environment: {} })
      const result = compiledTemplate({ title: 'Test' })

      expect(mockTemplate.render).toHaveBeenCalledWith({ title: 'Test' })
      expect(result).toBe('<html>Test</html>')
    })
  })
})
