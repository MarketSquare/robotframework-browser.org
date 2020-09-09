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
  <div v-for="(user, index) in data" :key="index" class="col-lg-3 col-md-4 col-sm-6 col-xs-12 mt-5 pr-lg-1 pl-lg-3 pl-md-5 pl-sm-3 p-xs-1">
        <div class="text-center p-3 mb-3" style="height:130px;background-color:#fff;">
        <a :href="user.href"><img class="img-fluid pb-2 user-image" :src="user.img"/></a>
        </div>
        <div class="card-body">
        <p v-html="user.text"></p>
        </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["data"]
};
</script>
