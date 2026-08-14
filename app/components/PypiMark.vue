<!--
  PyPI.

  Not the Python two-snake logo: that mark is the Python Software Foundation's,
  its licence restricts modification, and it is blue-and-yellow rather than
  monochrome — it could not take the colour of the link it sits in, and half of
  it would vanish against a dark ground.

  So this is a package box instead: a generic glyph, drawn here, saying "a
  package registry" without borrowing anyone's trademark. It is the odd one out
  among the three marks, and deliberately so — the label beside it does the
  identifying.
-->
<template>
  <svg
    class="mark"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.3"
    stroke-linejoin="round"
    stroke-linecap="round"
    aria-hidden="true"
    focusable="false"
  >
    <!-- Box: lid seam across the front, and the two top edges in perspective. -->
    <path d="M1.9 4.6 8 1.6l6.1 3v6.8L8 14.4l-6.1-3V4.6Z" />
    <path d="M1.9 4.6 8 7.6l6.1-3" />
    <path d="M8 7.6v6.8" />
  </svg>
</template>

<style scoped>
.mark {
  width: 1em;
  height: 1em;
  flex: none;
  vertical-align: -0.125em;
}
</style>
