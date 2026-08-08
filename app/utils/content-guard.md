# Why content queries are guarded inline

Nuxt Content ships a client-side SQLite WASM engine (~237 KB across
`sqlite3-worker1` and an OPFS proxy) as soon as a `queryCollection` call can
execute in the browser. Every route here is prerendered and Nuxt's payload
extraction carries the result, so the browser never needs to run the query.

Each call site therefore reads:

```ts
const { data } = await useAsyncData(key, async () => {
  // Server, plus the client in dev — see app/utils/content-guard.md
  if (import.meta.server || import.meta.dev) return await queryCollection(...)
  return null
})
```

Two things about that shape are deliberate, and both were learned the hard way.

**`import.meta.dev` is required.** Guarding on `import.meta.server` alone works
in production, because the prerendered payload carries the result. `nuxt dev`
has no payload extraction, so a client-side navigation ran the handler in the
browser, got nothing, and the page threw its own 404 — then rendered correctly
on reload, because that path is server-rendered.

**The guard must be written inline, not extracted into a composable.** Nuxt
replaces `import.meta.server` and `import.meta.dev` with literals per module,
so an inline `if (false || false)` is dead code and the `queryCollection` call
is eliminated from the client graph. Behind a function boundary the handler is
a closure that is always referenced, the compiler cannot prove it is never
called, and the engine is pulled back in: doing exactly that took reachable
client JS from 361 KB to 574 KB.

`scripts/check-bundle.mjs` fails the build if the engine becomes reachable
again.
