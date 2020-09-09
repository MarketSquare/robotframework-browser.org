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
  <div class="row justify-content-between">
      <div v-for="item in data" :key="item.header" style="margin-bottom:10px;" class="col-xl-4 col-lg-12">
      <b-card :header="item.header" class="text-center feature-box">
          <div v-if="item.text != ''" class="b-card-body" v-html="item.text"/>
          <div v-if="typeof item.img != 'undefined'" class="b-card-body">

              <img center v-b-modal="item.header" :src="item.img" style="cursor:pointer;" class="img-fluid"/>
              <b-modal
                  hide-footer
                  hide-header
                  :id="item.header"
                  centered>
                  <img center fluid class="img-fluid" :src="item.img_big"/>
                  <!-- <p style="text-align:center;"><a @click="openTab(item.img_big)" :href="item.img_big">Open image in new tab</a></p>-->
              </b-modal>

          </div>
      </b-card>


      </div>

  </div>
</template>

<script>
export default {
  props: ["data"],
  methods: {
    openTab(href) {
      var image = new Image();
      image.src = href;
      const w = window.open("");
      w.document.write(image.outerHTML);
    }
  }
};
</script>
