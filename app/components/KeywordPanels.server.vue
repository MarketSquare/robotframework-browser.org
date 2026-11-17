<script setup lang="ts">
/**
 * The body of the keyword reference: introduction, 151 keyword panels and 81
 * type panels. Structure follows the Libdoc redesign in aaltat/robotframework
 * — name, then Arguments, then Tags, then Documentation — merged with this
 * site's fonts, bevels and palette.
 *
 * A SERVER COMPONENT, deliberately.
 *
 * This markup carries every rendered documentation body in the library. As an
 * ordinary component it would cost twice: the 651 KB source lands in the
 * client bundle, and Nuxt serialises the same content again into the page
 * payload. Rendered as an island it is HTML and nothing else — the client
 * receives no data and re-renders nothing.
 *
 * The consequence to remember: nothing in here is reactive or interactive.
 * Filtering is done by the page around it, against the small index, by
 * toggling classes on these panels.
 */
/*
 * One file per version, reached through a glob rather than a static import.
 *
 * `import.meta.glob` gives Vite a map of loaders; only the one whose version
 * is asked for is ever executed, so rendering 19.12.4 does not pull the other
 * eleven into memory. Eager is safe here *because this is a server component*
 * — none of it can reach a browser.
 */
import type { ResolvedArg } from '~/composables/useLibdoc'

const FULL = import.meta.glob('~/generated/full/*.json', { eager: true, import: 'default' }) as Record<string, unknown>

const props = defineProps<{ version?: string }>()

function forVersion(version: string) {
  const hit = Object.entries(FULL).find(([path]) => path.endsWith(`/${version}.json`))
  if (!hit) {
    throw new Error(
      `No rendered documentation for ${version}. `
      + `Have: ${Object.keys(FULL).map(p => p.split('/').pop()).join(', ')}`,
    )
  }
  return hit[1]
}

const full = forVersion(props.version ?? LATEST_VERSION)

const data = full as unknown as {
  version: string
  intro: string
  importing: { doc: string; args: ResolvedArg[] } | null
  keywords: {
    name: string
    slug: string
    shortdocHtml: string
    doc: string
    tags: string[]
    group: string
    args: ResolvedArg[]
    returnTypeName: string | null
    returnTypeHref: string | null
    returnDoc: string
    sourceUrl: string | null
    lineno: number
  }[]
  types: {
    name: string
    slug: string
    anchor: string
    kind: string
    doc: string
    accepts: string[]
    members: { name: string; value: string }[]
    items: { key: string; type: string; required: boolean }[]
    usedBy: { name: string; slug: string }[]
  }[]
}

const KIND_BLURB: Record<string, string> = {
  Enum: 'One of a fixed set of values, written as a plain string.',
  TypedDict: 'A dictionary with known keys.',
  Custom: 'Converted by the library from the string you write.',
  Standard: 'Converted by Robot Framework itself.',
}
</script>

<template>
  <div class="panels">
    <!-- ---------- library introduction ---------- -->
    <section id="introduction" class="intro-section">
      <h2>Introduction</h2>

      <!--
        Say where this came from, at the top.

        Everything below is generated from the library's own Libdoc output, and
        a reader who wants the original — to check a rendering, to link the
        canonical page, or because they know that one — should not have to
        guess that it still exists.
      -->
      <p class="source-note">
        <RobotMark />
        <!--
          One span, not loose text: the note is a flex row, and in a flex row
          every stretch of text becomes its own item — so the gap that spaces
          the mark from the sentence also opened up before each full stop.
        -->
        <span>Generated from the library's Libdoc for <b>{{ data.version }}</b>. The original is at <a
          href="https://marketsquare.github.io/robotframework-browser/Browser.html"
          rel="noopener"
        >Browser.html</a>.</span>
      </p>

      <!-- eslint-disable-next-line vue/no-v-html -- sanitized at build in lib/libdoc.ts -->
      <div class="doc" v-html="data.intro" />

      <!--
        Importing: where Robot's own HTML puts it, between the introduction and
        the keywords. Libdoc builds it from the library's `__init__` rather than
        from the introduction text, so it is rendered here from its own field.
        Inside #introduction, because it is documentation, not a keyword — the
        rail lists it under Documentation, and filtering hides it with the rest.
      -->
      <template v-if="data.importing">
        <h2 id="importing">Importing</h2>
        <!-- eslint-disable-next-line vue/no-v-html -- sanitized at build in lib/libdoc.ts -->
        <div class="doc" v-html="data.importing.doc" />
        <div v-if="data.importing.args.length" class="block">
          <h4>Arguments</h4>
          <KeywordArgs :args="data.importing.args" />
        </div>
      </template>
    </section>

    <!-- ---------- keywords ---------- -->
    <h2 id="keywords" class="group-heading">
      Keywords <i>{{ data.keywords.length }}</i>
    </h2>

    <article
      v-for="kw in data.keywords"
      :id="kw.slug"
      :key="kw.slug"
      class="kw"
      :data-name="kw.name.toLowerCase()"
      :data-tags="kw.tags.join(' ')"
      :data-group="kw.group"
    >
      <h3 class="kw-name">
        <a :href="`#${kw.slug}`" class="kw-anchor">{{ kw.name }}</a>
      </h3>

      <!-- eslint-disable-next-line vue/no-v-html -- escaped then inline-rendered -->
      <p class="kw-short" v-html="kw.shortdocHtml" />

      <!-- Arguments first, as in the redesign: it is what a reader came for. -->
      <div v-if="kw.args.length" class="block">
        <h4>Arguments</h4>
        <KeywordArgs :args="kw.args" />
      </div>
      <p v-else class="block none">Takes no arguments.</p>

      <div v-if="kw.returnTypeName || kw.returnDoc" class="block" :class="{ 'inline-block': !kw.returnDoc }">
        <h4>Returns</h4>
        <a v-if="kw.returnTypeHref" class="mono" :href="kw.returnTypeHref">{{ kw.returnTypeName }}</a>
        <span v-else-if="kw.returnTypeName" class="mono">{{ kw.returnTypeName }}</span>
        <!-- eslint-disable-next-line vue/no-v-html -- sanitized at build in lib/libdoc.ts -->
        <div v-if="kw.returnDoc" class="doc" v-html="kw.returnDoc" />
      </div>

      <div v-if="kw.tags.length" class="block">
        <h4>Tags</h4>
        <span class="pills">
          <span v-for="tag in kw.tags" :key="tag" class="pill">{{ tag }}</span>
        </span>
      </div>

      <div v-if="kw.doc" class="block">
        <h4>Documentation</h4>
        <!-- eslint-disable-next-line vue/no-v-html -- sanitized at build in lib/libdoc.ts -->
        <div class="doc" v-html="kw.doc" />
      </div>

      <p v-if="kw.sourceUrl" class="kw-source">
        <a :href="kw.sourceUrl" rel="noopener noreferrer" target="_blank">
          {{ kw.group }}, line {{ kw.lineno }}
        </a>
      </p>
    </article>

    <!-- ---------- data types ---------- -->
    <h2 id="types" class="group-heading">
      Data types <i>{{ data.types.length }}</i>
    </h2>

    <article
      v-for="t in data.types"
      :id="t.anchor"
      :key="t.slug"
      class="kw type"
      :data-name="t.name.toLowerCase()"
      data-tags=""
      data-group="Data types"
    >
      <h3 class="kw-name">
        <a :href="`#${t.anchor}`" class="kw-anchor">{{ t.name }}</a>
        <span class="kind">{{ t.kind }}</span>
      </h3>
      <p class="kw-short">{{ KIND_BLURB[t.kind] }}</p>

      <!-- eslint-disable-next-line vue/no-v-html -- sanitized at build in lib/libdoc.ts -->
      <div v-if="t.doc" class="doc block" v-html="t.doc" />

      <div v-if="t.members.length" class="block">
        <h4>Accepted values</h4>
        <span class="pills">
          <code v-for="m in t.members" :key="m.name" class="value">{{ m.name }}</code>
        </span>
      </div>

      <div v-if="t.items.length" class="block">
        <h4>Keys</h4>
        <div class="scroll-x">
          <table class="args">
            <thead><tr><th>Key</th><th>Required</th><th>Type</th></tr></thead>
            <tbody>
              <tr v-for="i in t.items" :key="i.key">
                <td class="a-name"><span class="ident">{{ i.key }}</span></td>
                <td class="a-default">{{ i.required ? 'yes' : 'no' }}</td>
                <td class="a-type">{{ i.type }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="t.usedBy.length" class="block">
        <h4>Used by</h4>
        <span class="pills">
          <a v-for="u in t.usedBy" :key="u.slug" class="pill link" :href="`#${u.slug}`">{{ u.name }}</a>
        </span>
      </div>
    </article>
  </div>
</template>
