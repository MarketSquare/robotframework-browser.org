/*
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
*/

// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
/* eslint-disable no-new */

// for IE11 support (https://bootstrap-vue.js.org/docs/#browsers-support)
import 'babel-polyfill'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import Vue from 'vue'
import App from './App'

import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import NavigationVertical from '@/components/NavigationVertical'
import BootstrapVue from 'bootstrap-vue'

Vue.use(BootstrapVue)

require('@/assets/css/main.css')
require('@/assets/css/pygments.css')

Vue.config.productionTip = false

Vue.component('app-header', AppHeader)
Vue.component('navigation-vertical', NavigationVertical)
Vue.component('app-footer', AppFooter)

new Vue({
  el: '#app',
  template: '<App/>',
  components: {
    App
  }
})
