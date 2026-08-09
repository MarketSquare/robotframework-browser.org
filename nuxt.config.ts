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

export default defineNuxtConfig({
  compatibilityDate: '2026-08-08',
  /*
   * nuxt-studio gives a visual editor over the Markdown and JSON in content/,
   * mounted by the dev server. Dev only on purpose: it is an authoring tool,
   * and the deployed site is a static build with no editing surface.
   */
  modules: ['@nuxt/content', ...(process.env.NODE_ENV === 'production' ? [] : ['nuxt-studio'])],

  devtools: { enabled: false },

  hooks: {
    'content:file:beforeParse'(ctx) {
      if (!ctx.file.body || typeof ctx.file.body !== 'string') return
      ctx.file.body = ctx.file.body.replace(/%%(\w+)%%/g, (whole, name: string) => {
        const value = VERSIONS[name]
        if (value === undefined) {
          // Loud, not silent: a typo would otherwise ship as literal text.
          throw new Error(
            `${ctx.file.id}: unknown version token ${whole}. `
            + `Known: ${Object.keys(VERSIONS).join(', ')}`,
          )
        }
        return value
      })
    },
  },

  // Static output for GitHub Pages. No server, no runtime API.
  ssr: true,
  nitro: {
    // 151 keyword + 81 type routes are discovered by crawling /keywords.
    preset: 'github-pages',
    prerender: { crawlLinks: true, routes: ['/', ...releaseRoutes], failOnError: true },
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
      link: [{ rel: 'icon', href: '/logo/browser.svg', type: 'image/svg+xml' }],
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
