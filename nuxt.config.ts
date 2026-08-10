import { readFileSync, readdirSync } from 'node:fs'

/*
 * Version numbers the content quotes, written by scripts/build-versions.ts
 * from the library itself. Content says `%{browser}` and the hook below
 * substitutes it while the Markdown is still raw text — which is the only
 * point at which a code fence can be reached, and most of these live in
 * `docker pull` lines and Dockerfiles.
 */
const VERSIONS: Record<string, string> = JSON.parse(
  readFileSync('app/generated/versions.json', 'utf8'),
)

/*
 * Release note routes, listed explicitly.
 *
 * Nitro's crawler skips links whose last segment looks like a filename, and
 * `/releases/20.3.0` ends in what it reads as a `.0` extension — so the index
 * page was prerendered with twelve links to pages that were never built.
 * Reading the directory here keeps the list from being maintained by hand.
 */
const releaseRoutes = readdirSync('content/releases')
  .filter(f => f.endsWith('.md'))
  .map(f => `/releases/${f.replace(/\.md$/, '')}`)

/*
 * The keyword reference for every version we hold data for, the current
 * release included.
 *
 * Same crawler limitation as above — `/keywords/20.2.0` reads as a file with a
 * `.0` extension. The current release is in the list rather than redirecting
 * to /keywords: a redirect needs a server, and on a static host
 * /keywords/20.3.0 was simply a 404 with an empty page. It renders the same
 * content as /keywords and points a canonical link there.
 *
 * The list comes from the committed manifest, not from `app/generated/index`.
 * That directory is built by `pnpm libdoc` and rightly gitignored — 8 MB of
 * rendered keyword bodies — but this config is loaded by `nuxt prepare` during
 * `pnpm install`, before any script has run. Reading it there made a clean
 * clone fail to install.
 */
const keywordRoutes = (VERSIONS.documented as unknown as string[]).map(v => `/keywords/${v}`)

export default defineNuxtConfig({
  compatibilityDate: '2026-08-08',
  /*
   * nuxt-studio gives a visual editor over the Markdown and JSON in content/,
   * mounted by the dev server. Dev only on purpose: it is an authoring tool,
   * and the deployed site is a static build with no editing surface.
   */
  modules: ['@nuxt/content', ...(process.env.NODE_ENV === 'production' ? [] : ['nuxt-studio'])],

  devtools: { enabled: false },

  /*
   * There is deliberately no `content:file:beforeParse` substitution here.
   *
   * `%%browser%%` and friends used to be replaced in the Markdown source
   * before it was parsed, which left the parsed content and the file on disk
   * saying different things. Nuxt Studio seeds its editor from the parsed side
   * and writes that back, so merely *opening* a page in Studio -- no edit, no
   * save -- rewrote every token in the file to a frozen version number.
   *
   * Tokens now survive the whole content pipeline untouched and are resolved
   * when the page renders. See app/utils/version-tokens.ts.
   */

  // Static output for GitHub Pages. No server, no runtime API.
  ssr: true,
  nitro: {
    // 151 keyword + 81 type routes are discovered by crawling /keywords.
    preset: 'github-pages',
    prerender: { crawlLinks: true, routes: ['/', ...releaseRoutes, ...keywordRoutes], failOnError: true },
  },

  /*
   * Server components. The keyword reference is one page carrying all 151
   * rendered documentation bodies; rendering it in an island keeps that
   * markup out of both the client bundle and the Nuxt payload.
   */
  experimental: { componentIslands: true },

  css: ['~/assets/css/tokens.css', '~/assets/css/base.css', '~/assets/css/plate.css', '~/assets/css/doc.css', '~/assets/css/keywords.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'icon', href: '/logo/browser.svg', type: 'image/svg+xml' },
        /*
         * Only the two faces the first screen actually needs: the display face
         * every heading uses, and the body regular. The 600 weight and the
         * mono are left to be discovered — preloading everything competes with
         * the fonts that decide when text appears.
         */
        { rel: 'preload', as: 'font', type: 'font/woff', href: '/fonts/ocr-a.woff', crossorigin: '' },
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/plex-sans-400.woff2', crossorigin: '' },
      ],
      script: [
        {
          // Applies a stored theme choice before first paint. Without this the
          // page renders in the OS theme and then snaps — a visible flash.
          innerHTML:
            "try{var t=localStorage.getItem('rfb-theme');if(t==='light'||t==='dark'||t==='contrast')document.documentElement.dataset.theme=t}catch(e){}",
          tagPosition: 'head',
        },
      ],
    },
  },
})
