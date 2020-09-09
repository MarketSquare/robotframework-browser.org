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
  <section :id="page.title.toLowerCase()">
    <examples v-if="Object.keys(page.data).length === 0 && page.data.constructor === Object"/>
    <feature-box v-if="page.feature_box == true" :data="page.data.text"/>
    <text-block v-if="page.text_block == true" :data="page.data.text" :members="page.member_box ? page.data.members : []"/>
    <tab-box v-if="page.tab_box == true" :data="page.data.tabs"/>
    <user-box v-if="page.user_box == true" :data="page.data.users"/>
    <community-block v-if="page.community_block" :data="page.data.items"/>
    <contributor-block />    
  </section>
</template>

<script>
import FeatureBox from "@/components/FeatureBox.vue";
import TabBox from "@/components/TabBox.vue";
import TextBlock from "@/components/TextBlock.vue";
import UserBox from "@/components/UserBox.vue";
import CommunityBlock from "@/components/CommunityBlock.vue";
import ContributorBlock from "@/components/ContributorBlock.vue"

import Examples from "@/components/pages/Examples";

export default {
  components: {
    FeatureBox,
    TextBlock,
    TabBox,
    UserBox,
    CommunityBlock,
    ContributorBlock,
    Examples
  },
  props: ["page"]
};
</script>
