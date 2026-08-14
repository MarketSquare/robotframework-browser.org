<template>
  <NuxtRouteAnnouncer />
  <NuxtPage />
  <!--
    Here rather than in each page: eight pages mount <SiteHeader /> themselves,
    and a footer added the same way would sooner or later be missing from one.
  -->
  <SiteFooter />
</template>
