export default defineNuxtConfig({
  compatibilityDate: '2026-08-08',
  /*
   * nuxt-studio gives a visual editor over the Markdown and JSON in content/,
   * mounted by the dev server. Dev only on purpose: it is an authoring tool,
   * and the deployed site is a static build with no editing surface.
   */
  modules: ['@nuxt/content', ...(process.env.NODE_ENV === 'production' ? [] : ['nuxt-studio'])],

  devtools: { enabled: false },

  // Static output for GitHub Pages. No server, no runtime API.
  ssr: true,
  nitro: {
    // 151 keyword + 81 type routes are discovered by crawling /keywords.
    preset: 'github-pages',
    prerender: { crawlLinks: true, routes: ['/'], failOnError: true },
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
