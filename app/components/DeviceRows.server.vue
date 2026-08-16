<script setup lang="ts">
/**
 * The device table itself: caption, head and 207 devices.
 *
 * A SERVER COMPONENT, for the same reason as KeywordPanels.
 *
 * The descriptors are 84 KB, three quarters of it user agent strings. As an
 * ordinary import that lands in every page's JavaScript, and the build measured
 * it: 67 KB over the ceiling in check-bundle.mjs, and still 34 KB over after
 * splitting the agents out to fetch on demand — the ceiling had 2 KB spare.
 *
 * Rendered as an island it is HTML and nothing else. Everything the filters
 * need to make a decision rides along as a `data-` attribute, so the component
 * around this one filters and sorts by reading the DOM rather than a copy of
 * the data.
 *
 * The consequence to remember: nothing in here is reactive or interactive.
 * DeviceTable.vue attaches the behaviour after hydration.
 *
 * Each device is its own `<tbody>` — a table may have many — holding its row
 * and its user agent row. That makes the pair a single thing to hide, and a
 * single thing to move when a column is sorted.
 */
import DEVICES from '~/generated/devices.json'

interface Viewport { width: number, height: number }
interface Device {
  userAgent: string
  viewport: Viewport
  deviceScaleFactor: number
  isMobile: boolean
  hasTouch: boolean
  defaultBrowserType: string
  screen?: Viewport
}

const devices = DEVICES.devices as unknown as Record<string, Device>
const entries = Object.entries(devices)

/**
 * Landscape starts hidden, matching the control DeviceTable renders beside it.
 *
 * Baked in here rather than applied after hydration: the alternative shows all
 * 207 rows for as long as hydration takes and then drops 100 of them, which is
 * a hundred-row jump on first paint. The caption says which rows are showing,
 * so nothing is left out quietly — including for a reader with no JavaScript,
 * who sees the same statement and the same 107 devices.
 */
const landscape = (name: string) => name.endsWith(' landscape')
const shown = entries.filter(([name]) => !landscape(name)).length
</script>

<template>
  <div class="scroll-x">
    <!--
      The no-JavaScript fallback is a `@media (scripting: none)` block in
      DeviceTable.vue, not a <noscript> here.

      A <noscript> was the obvious way and it broke the page for everyone else:
      Nuxt inserts island markup with innerHTML, and an innerHTML parse treats
      the contents of <noscript> as real elements rather than as text. The
      fallback stylesheet went live in browsers that had JavaScript, and the
      expand button — which that stylesheet hides — was `display: none` on all
      207 rows.
    -->
    <table class="device-table" :data-total="entries.length">
      <caption>
        <span class="count">{{ shown }} of {{ entries.length }} descriptors</span>,
        from Playwright {{ DEVICES.playwright }}.
      </caption>
      <thead>
        <tr>
          <th scope="col" data-sort="name" aria-sort="ascending">
            <button type="button">
              Device<span class="caret" aria-hidden="true" />
            </button>
          </th>
          <th scope="col" class="num" data-sort="width">
            <button type="button">
              Viewport<span class="caret" aria-hidden="true" />
            </button>
          </th>
          <th scope="col" class="num" data-sort="dpr">
            <button type="button">
              DPR<span class="caret" aria-hidden="true" />
            </button>
          </th>
          <th scope="col">Touch</th>
          <th scope="col">Mobile</th>
          <th scope="col">Engine</th>
          <th scope="col"><span class="sr-only">User agent</span></th>
        </tr>
      </thead>
      <tbody
        v-for="[name, d] in entries"
        :key="name"
        :data-name="name.toLowerCase()"
        :data-width="d.viewport.width"
        :data-dpr="d.deviceScaleFactor"
        :data-engine="d.defaultBrowserType"
        :data-touch="d.hasTouch ? 'yes' : 'no'"
        :data-orientation="landscape(name) ? 'landscape' : 'portrait'"
        :hidden="landscape(name)"
      >
        <tr>
          <th scope="row"><code>{{ name }}</code></th>
          <td class="num">{{ d.viewport.width }}&thinsp;×&thinsp;{{ d.viewport.height }}</td>
          <td class="num">{{ d.deviceScaleFactor }}</td>
          <td>{{ d.hasTouch ? 'yes' : '—' }}</td>
          <td>{{ d.isMobile ? 'yes' : '—' }}</td>
          <td>{{ d.defaultBrowserType }}</td>
          <td class="expand">
            <button
              type="button"
              class="expand-button"
              aria-expanded="false"
              :aria-label="`User agent for ${name}`"
            >+</button>
          </td>
        </tr>
        <tr class="detail" hidden>
          <td colspan="7">
            <dl>
              <dt>User agent</dt>
              <dd><code>{{ d.userAgent }}</code></dd>
              <template v-if="d.screen">
                <dt>Screen</dt>
                <dd><code>{{ d.screen.width }} × {{ d.screen.height }}</code></dd>
              </template>
            </dl>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
