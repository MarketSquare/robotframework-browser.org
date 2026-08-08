<script setup lang="ts">
/**
 * <Terminal> — literal shell only. Spec §5.4, D21.
 *
 * Install commands, `rfbrowser init`, running `robot`, CLI invocations.
 * Never code: code goes in <Editor>. The traffic-light dots are what tells
 * a reader which of the two they are looking at before reading a character.
 *
 * When more than one shell is supplied, the tabs auto-select the reader's
 * own OS on mount. SSR always renders the first session so the prerendered
 * HTML is deterministic.
 */
import { type Shell, SHELL_LABEL, SHELL_PROMPT, detectShell } from '~/utils/os'

export interface TerminalStep {
  /** Typed at the prompt. This, and only this, is what the copy button yields. */
  command: string
  /** Program output, dimmed. */
  output?: string[]
  /** Result lines: a tick in teal, a cross in red. */
  status?: { ok: boolean; text: string }[]
}

export interface TerminalSession {
  shell: Shell
  steps: TerminalStep[]
}

const props = defineProps<{
  sessions: TerminalSession[]
  /** Rendered when there is only one session and therefore no tabs. */
  title?: string
}>()

const uid = useId()
const selected = ref<Shell>(props.sessions[0]!.shell)
/** A reader's click must never be undone by detection running late. */
const chosenByUser = ref(false)

const multi = computed(() => props.sessions.length > 1)

onMounted(() => {
  if (!multi.value || chosenByUser.value) return
  const shell = detectShell(navigator)
  if (props.sessions.some(s => s.shell === shell)) selected.value = shell
})

const active = computed(
  () => props.sessions.find(s => s.shell === selected.value) ?? props.sessions[0]!,
)

/** Commands only — prompts and output are chrome. */
const copyText = computed(() => active.value.steps.map(s => s.command).join('\n'))

function pick(shell: Shell) {
  chosenByUser.value = true
  selected.value = shell
}
</script>

<template>
  <div class="plate term">
    <div class="plate-bar">
      <span class="plate-dots" aria-hidden="true"><i /><i /><i /></span>

      <template v-if="multi">
        <div class="plate-tabs" role="tablist" :aria-label="'Shell'">
          <template v-for="s in props.sessions" :key="s.shell">
            <input
              :id="`${uid}-${s.shell}`"
              class="plate-radio"
              type="radio"
              :name="`${uid}-shell`"
              :checked="selected === s.shell"
              @change="pick(s.shell)"
            >
            <label class="plate-tab plate-tab--shell" :for="`${uid}-${s.shell}`">
              {{ SHELL_LABEL[s.shell] }}
            </label>
          </template>
        </div>
      </template>
      <span v-else class="plate-title">{{ props.title ?? SHELL_LABEL[active.shell] }}</span>

      <span class="plate-actions">
        <CopyButton :text="copyText" label="Copy commands" />
      </span>
    </div>

    <div class="plate-body">
      <pre><template v-for="(step, i) in active.steps" :key="i"><span class="term-line"><span class="term-prompt">{{ SHELL_PROMPT[active.shell] }}</span><span class="term-command">{{ step.command }}</span></span>
<template v-for="(line, j) in step.output ?? []" :key="`o${j}`"><span class="term-line term-output">{{ line }}</span>
</template><template v-for="(s, k) in step.status ?? []" :key="`s${k}`"><span class="term-line"><span :class="s.ok ? 'term-ok' : 'term-fail'">{{ s.ok ? '✓' : '✗' }}</span> <span class="term-output">{{ s.text }}</span></span>
</template></template></pre>
    </div>
  </div>
</template>
