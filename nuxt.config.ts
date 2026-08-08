export default defineNuxtConfig({
  compatibilityDate: '2026-08-08',
  modules: ['@nuxt/content'],
  devtools: { enabled: false },

  // Static output for GitHub Pages. No server, no runtime API.
  ssr: true,
  nitro: {
    preset: 'github-pages',
    prerender: { crawlLinks: true, routes: ['/'], failOnError: true },
  },

  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],

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
            "try{var t=localStorage.getItem('rfb-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}",
          tagPosition: 'head',
        },
      ],
    },
  },
})
