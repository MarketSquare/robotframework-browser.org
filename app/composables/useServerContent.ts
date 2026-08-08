/**
 * A content query that runs on the server, and in the browser only in dev.
 *
 * Why not simply query everywhere: Nuxt Content ships a client-side SQLite
 * WASM engine (~237 KB across sqlite3-worker1 and an OPFS proxy) as soon as a
 * `queryCollection` call can execute in the browser. Every route here is
 * prerendered and Nuxt's payload extraction carries the result, so the browser
 * never needs to run the query — and keeping it server-only keeps that engine
 * out of the bundle entirely.
 *
 * Why the dev exception: `nuxt dev` has no payload extraction. Guarding on
 * `import.meta.server` alone therefore made the handler return nothing on a
 * client-side navigation in dev, so a page whose data was missing threw its
 * own 404 — and then rendered perfectly on reload, because that path is
 * server-rendered. Production was fine, which is exactly what made it easy to
 * miss. Bundle size in dev is irrelevant, so dev queries on the client too.
 */
export function useServerContent<T>(key: string, handler: () => Promise<T>, empty: T) {
  return useAsyncData<T>(key, async () => {
    if (import.meta.server || import.meta.dev) return await handler()
    return empty
  })
}
