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
  <section id="examples">

        <text-block :data="data"/> 
    <div class="row">
    
      <div class="col-md-12 order-md-2 order-lg-1">
          <b-tabs cards pills class="nav-fill card " v-model="tabIndex" @input="changeTabText(tabIndex)">


          <b-tab title="Testing with Robot Framework">
            <pre class="highlight">
                <div style="color: #bbbbbb;background-color: #002b36;font-family: Menlo, Monaco, 'Courier New', monospace;font-weight: normal;line-height: 18px;white-space: pre;"><div><span style="color: #cb4b16;">*** Settings ***</span></div><div><span style="color: #93a1a1;font-weight: bold;">Library</span><span style="color: #bbbbbb;">   </span><span style="color: #6c71c4;">Browser</span></div><br><div><span style="color: #cb4b16;">*** Test Cases ***</span></div><div><span style="color: #268bd2;">Example Test</span></div><div><span style="color: #bbbbbb;">    New Page</span><span style="color: #2aa198;">    https://playwright.dev</span></div><div><span style="color: #bbbbbb;">    Get Text</span><span style="color: #2aa198;">    h1    ==    🎭 Playwright</span></div></div>
            </pre>
          </b-tab>
          <b-tab title="Testing with Python">
            <pre class="highlight">
               <div style="color: #bbbbbb;background-color: #002b36;font-family: Menlo, Monaco, 'Courier New', monospace;font-weight: normal;line-height: 18px;white-space: pre;"><div><span style="color: #859900;">from</span><span style="color: #bbbbbb;"> Browser </span><span style="color: #859900;">import</span><span style="color: #bbbbbb;"> Browser</span></div><div><span style="color: #859900;">from</span><span style="color: #bbbbbb;"> Browser.utils.data_types </span><span style="color: #859900;">import</span><span style="color: #bbbbbb;"> SupportedBrowsers</span></div><br><div><span style="color: #bbbbbb;">b </span><span style="color: #859900;">=</span><span style="color: #bbbbbb;"> Browser(timeout</span><span style="color: #859900;">=</span><span style="color: #2aa198;">"20 s"</span><span style="color: #bbbbbb;">, retry_assertions_for</span><span style="color: #859900;">=</span><span style="color: #2aa198;">"500 ms"</span><span style="color: #bbbbbb;">)</span></div><div><span style="color: #bbbbbb;">b.new_browser(browser</span><span style="color: #859900;">=</span><span style="color: #bbbbbb;">SupportedBrowsers.chromium)</span></div><div><span style="color: #bbbbbb;">b.new_context(</span></div><div><span style="color: #bbbbbb;">    acceptDownloads</span><span style="color: #859900;">=</span><span style="color: #b58900;">True</span><span style="color: #bbbbbb;">,</span></div><div><span style="color: #bbbbbb;">    viewport</span><span style="color: #859900;">=</span><span style="color: #bbbbbb;">{</span><span style="color: #2aa198;">"width"</span><span style="color: #bbbbbb;">: </span><span style="color: #d33682;">1920</span><span style="color: #bbbbbb;">, </span><span style="color: #2aa198;">"height"</span><span style="color: #bbbbbb;">: </span><span style="color: #d33682;">1080</span><span style="color: #bbbbbb;">},</span></div><div><span style="color: #bbbbbb;">    httpCredentials</span><span style="color: #859900;">=</span><span style="color: #bbbbbb;">{</span><span style="color: #2aa198;">"username"</span><span style="color: #bbbbbb;">: </span><span style="color: #2aa198;">"admin"</span><span style="color: #bbbbbb;">, </span><span style="color: #2aa198;">"password"</span><span style="color: #bbbbbb;">: </span><span style="color: #2aa198;">"123456"</span><span style="color: #bbbbbb;">},</span></div><div><span style="color: #bbbbbb;">)</span></div><div><span style="color: #bbbbbb;">b.new_page(</span><span style="color: #2aa198;">"https://playwright.dev"</span><span style="color: #bbbbbb;">)</span></div><div><span style="color: #859900;">assert</span><span style="color: #bbbbbb;"> b.get_text(</span><span style="color: #2aa198;">"h1"</span><span style="color: #bbbbbb;">) </span><span style="color: #859900;">==</span><span style="color: #bbbbbb;"> </span><span style="color: #2aa198;">"🎭 Playwright"</span></div><div><span style="color: #bbbbbb;">b.close_browser()</span></div><br></div>
            </pre>
          </b-tab>

        </b-tabs>
        </div>
  </div>
 </section>
</template>

<script>
import TextBlock from "@/components/TextBlock.vue";

export default {
  components: {
    TextBlock
  },
  data() {
    return {
      tabText: "",
      data: {
        header: "Examples",
        text: ""
      },
      tabIndex: 0,
      items: [
        {
          text:
            '<p> New up-to-date keyword design makes Browser library intuitive to use and fast to design with. </p>'
        },
        {
          text:
            '<p> The Browser class can also be used directly from Python. You can design your own Robot Framework Libraries by using Browser internally or create your own Python based Test with a framework like PyTest. </p> <p> It is designed to support the user as much as possible within a Python IDE with typehints, enum types and code completion. </p>'
        }
      ]
    };
  },
  created: function() {
    this.changeTabText(this.tabIndex);
  },
  methods: {
    changeTabText(tabIndex) {
      this.data.text = this.items[tabIndex].text;
    }
  }
};
</script>
