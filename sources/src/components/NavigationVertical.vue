<!--
Copyright 2020 -     Robot Framework Foundation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

This code was derived from https://github.com/robotframework/robotframework.github.com
-->

<template>
<section>
<b-nav  v-b-scrollspy:scroller.50 tag="nav" toggleable="md" vertical id="navigation" class="col-sm-3 col-md-2 d-none d-md-block sidebar">
  <b-navbar-brand style="text-transform:uppercase;">
        <b-img :src="require('@/assets/img/ROBOTFW_Mark_White_LOW_cropped.png')" class="img-fluid" alt="Robot Frameworkg logo"/>
  </b-navbar-brand>
    <b-nav-item
      v-for="item in pages.filter(page => !page.hide_from_nav)"
      v-bind:key="item.title"
      :target="item.url ? '_blank' : '_self'"
      :href="item.url ? item.url : '#'+item.title.toLowerCase()">
      <div v-if="item.title === 'Foundation'" style="margin-top: 1rem"></div>
        {{item.title}}
        <span
          v-if="item.url"
          style="margin-left: -5px">
          <img src="../assets/img/external_link.svg">
        </span>
      </b-nav-item>
</b-nav>


 <b-navbar  toggleable="md" fixed="top" type="dark" id="navigation-collapsed" class="d-md-none">
  <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
  <b-navbar-brand class="p-0 m-0 d-block d-md-none" href="#">
    ROBOT FRAMEWORK <b-img :src="require('@/assets/img/ROBOTFW_Mark_White_LOW_cropped.png')" class="" style="height:30px;"  alt="Robot Frameworkg logo"/>
  </b-navbar-brand>
  <b-collapse is-nav id="nav_collapse">
    <b-navbar-nav class="align-middle" style="margin-top: 1rem">
      <b-nav-item
        v-for="item in pages.filter(page => !page.hide_from_nav)"
        v-bind:key="item.title"
        :target="item.url ? '_blank' : '_self'"
        style="font-size: 1rem"
        :href="item.url ? item.url : '#'+item.title.toLowerCase()">
          <div v-if="item.title === 'Foundation'" style="margin-top: 1rem"></div>
          {{item.title}}
          <span
            v-if="item.url"
            style="margin-left: -5px">
            <img src="../assets/img/external_link.svg">
          </span>
        </b-nav-item>
    </b-navbar-nav>
  </b-collapse>

</b-navbar>
</section>
</template>

<script>
export default {
  props: ["pages"],
  methods: {
    onActivate(target) {
      ga('send', 'event', 'componentView', target);
    }
  },
  created() {
    this.$root.$on("bv::scrollspy::activate", this.onActivate);
  }
};
</script>
