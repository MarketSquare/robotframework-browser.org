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
  <div class="row">
        <b-tabs pills class="card nav-fill col-lg-12 m-3">
          <b-tab v-for="(tab,index) in data" :key="index" :title="tab.title" class="p-1">
            <div id="{tab.title}-standard" class="card-body row">
              <div v-for="(item,index) in tab.items" :key="index" class="link  col-md-4">
                <b-embed v-if="typeof item.src != 'undefined'" type="iframe"
                        :src="item.src"
                        allowfullscreen
                ></b-embed>
                <a :href="item.href" target="_blank">{{item.title}}</a>
                <p v-html="item.text"/>
              </div>
            </div>
          </b-tab>
        </b-tabs>
  </div>
</template>

<script>
export default {
  props: ["data"]
};
</script>
