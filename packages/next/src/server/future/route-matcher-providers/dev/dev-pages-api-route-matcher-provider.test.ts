import path from 'path'
import { PagesAPIRouteDefinition } from '../../route-definitions/pages-api-route-definition'
import { RouteKind } from '../../route-kind'
import { DevPagesAPIRouteMatcherProvider } from './dev-pages-api-route-matcher-provider'
import { MockFileReader } from '../../helpers/file-reader/helpers/mock-file-reader'

const normalizeSlashes = (p: string) => p.replace(/\//g, path.sep)

describe('DevPagesAPIRouteMatcherProvider', () => {
  const dir = '<root>'
  const extensions = ['ts', 'tsx', 'js', 'jsx']

  it('returns no routes with an empty filesystem', async () => {
    const reader = new MockFileReader()
    const spy = jest.spyOn(reader, 'read')
    const matcher = new DevPagesAPIRouteMatcherProvider(dir, extensions, reader)
    const matchers = await matcher.matchers()
    expect(matchers).toHaveLength(0)
    expect(spy).toBeCalledWith(dir, { recursive: true })
  })

  describe('filename matching', () => {
    it.each<{
      files: ReadonlyArray<string>
      route: PagesAPIRouteDefinition
    }>([
      {
        files: [normalizeSlashes(`${dir}/api/other/route.ts`)],
        route: {
          kind: RouteKind.PAGES_API,
          pathname: '/api/other/route',
          filename: normalizeSlashes(`${dir}/api/other/route.ts`),
          page: '/api/other/route',
          bundlePath: 'pages/api/other/route',
        },
      },
      {
        files: [normalizeSlashes(`${dir}/api/other/index.ts`)],
        route: {
          kind: RouteKind.PAGES_API,
          pathname: '/api/other',
          filename: normalizeSlashes(`${dir}/api/other/index.ts`),
          page: '/api/other',
          bundlePath: 'pages/api/other',
        },
      },
      {
        files: [normalizeSlashes(`${dir}/api.ts`)],
        route: {
          kind: RouteKind.PAGES_API,
          pathname: '/api',
          filename: normalizeSlashes(`${dir}/api.ts`),
          page: '/api',
          bundlePath: 'pages/api',
        },
      },
      {
        files: [normalizeSlashes(`${dir}/api/index.ts`)],
        route: {
          kind: RouteKind.PAGES_API,
          pathname: '/api',
          filename: normalizeSlashes(`${dir}/api/index.ts`),
          page: '/api',
          bundlePath: 'pages/api',
        },
      },
    ])(
      "matches the '$route.page' route specified with the provided files",
      async ({ files, route }) => {
        const reader = new MockFileReader([
          ...extensions.map((ext) => `${dir}/some/other/page.${ext}`),
          ...extensions.map((ext) => `${dir}/some/other/route.${ext}`),
          `${dir}/some/api/route.ts`,
          ...files,
        ])
        const spy = jest.spyOn(reader, 'read')
        const matcher = new DevPagesAPIRouteMatcherProvider(
          dir,
          extensions,
          reader
        )
        const matchers = await matcher.matchers()
        expect(matchers).toHaveLength(1)
        expect(spy).toBeCalledWith(dir, { recursive: true })
        expect(matchers[0].definition).toEqual(route)
      }
    )
  })
})
