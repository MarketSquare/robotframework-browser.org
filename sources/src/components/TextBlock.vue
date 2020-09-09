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
  <div>
    <div v-if="data && !members.length" class="row justify-content-between no-gutters">
      <div class="col-md-5 col-lg-4 order-1 textblock-left p-3">
        <h1 v-html="data.header"/>
      </div>
      <div v-if="data.header != 'Examples'" class="col order-2 textblock-right ml-1 p-3">
        <div v-html="data.text"/>
      </div>
      <div v-else v-html="data.text" class="col order-2 block-text textblock-right ml-1 p-3"/>

      <div v-if="data.twitter == true" class="col-md-12 col-lg-3 order-3 textblock-right ml-1 p-3" style="max-height: 700px; overflow: scroll">
        <twitter-timeline class="p-xs-5 p-lg-0" id="robotframework" widget-class="twitterprofile" sourceType="profile" :options="options"/>
      </div>
    </div>
    <div v-if="members.length" class="row">
      <div class="col-sm-12 pl-5 pr-5 row">
        <div v-html="data.membersText" />
      </div>
      <div class="col-sm-12 pl-5 pr-5 row">
        <div v-for="(member, index) in members" :key="index" class="col-lg-1 col-3 p-0">
          <div class="text-center p-1 mb-0" style="height:100px;background-color:#fff; display: flex; flex-direction: column; justify-content: center;">
            <div>
              <a :href="member.href" target="blank"><img class="img-fluid pb-2 user-image" :src="member.img"/></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Timeline } from "vue-tweet-embed"
export default {
  props: {
    data: {
      type: Object,
      default: () => {}
    },
    members: {
      type: Array,
      default: () => []
    }
  },
  components: {
    "twitter-timeline": Timeline
  },
  data() {
    return {
      options: {
        theme: "light",
        tweetLimit: "3",
        chrome: ["nofooter", "noscrollbar"]
      }
    };
  }
};
</script>
