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
    <div class="row no-gutters">
     <div class="col-md-2">
         <navigation-vertical :pages="pages"/>
     </div>

    <div class="col-md-10" id="scroller"
    ref="content" style="position:relative;height:100vh;overflow-y:scroll;overflow-x:hidden;-webkit-overflow-scrolling: touch;">
        <app-header/>
        <page-block v-for="(page, index) in pages.filter(page => page.data)"
          v-bind:page="page"
          v-bind:index="index"
          v-bind:key="index"
          class="pl-md-5 px-lg-2 p-sm-3 py-2 p-xs-1"/>
	  <!-- <app-footer class="mt-0 py-5"/> -->
      </div>
    </div>
</template>
<script>
import PageBlock from "@/components/PageBlock.vue";
import marked from 'marked';

const introText = marked(`
Robot Framework deserves a browser automation solution that's designed for the 2020s.

Browser library powered by <a href="https://playwright.dev/" target="_blank">Playwright</a> provides...

🚀 Speed, ✅ reliability and 🔬 visibility.


- Conscientious assertions
- Fast yet precise browser window and tab control
- Chainable selector strategies
- Good shadow DOM support
- Simple descriptors for mobile devices
- Ability to send HTTP requests


See the <a href="https://marketsquare.github.io/robotframework-browser/Browser.html" target="_blank">keyword documentation</a> and our <a href="https://github.com/MarketSquare/robotframework-browser#robotframework-browser" target="_blank">project on Github</a>.


Join us for discussion and support at the <a href="https://forum.robotframework.org/c/libraries/browser" target="_blank">Robot Framework forum</a> and <a href="https://github.com/MarketSquare/robotframework-browser/issues" target="_blank">our GitHub issues</a>.

Use. Benefit. Contribute. Let's make the best Browser library.`)

const installText = marked(`
<h1 id="dependencies">Dependencies</h1>

Library installation requires both Python and Node.js® 
 1. Install <a href="https://www.python.org/downloads/" target="_blank">Python™</a>
 1. Install <a href="https://nodejs.org/en/download/" target="_blank">Node.js®</a>

<h1 id="installation">Installing</h1>

The Browser library can be installed in two different modes. 

While **developing**, having the browser binaries **bundled** with the library makes sense.

In **production**, it might make more sense to have them **separate**. 

<details><summary>Why might separate be better in production?</summary>
For example, in a <abbr title="Continuous Integration">CI</abbr> installation, where the environment may contain multiple library installations, it is beneficial 
to manage browser binaries outside of the library installation. This allows you to save disk space in the environment, because each environment contains
only one set of browser binaries. When installation is done for test case development, it is better to install browser binaries with the library.<br><br>
</details>
<br/>

## Bundled
<details open><summary>To install <em>with</em> browser binaries...</summary>

 1. Install Browser library from <a href="https://pypi.org/search/?q=robotframework-browser" target="_blank">PyPi</a> with pip:
        > pip install robotframework-browser
 1. Initialize the Browser library:
        > rfbrowser init

</details>
<br/>

## Separate
<details><summary>To install browser binaries <em>separately</em>...
</summary>

 1. Install Browser library from <a href="https://pypi.org/search/?q=robotframework-browser" target="_blank">PyPi</a> with pip:
        > pip install robotframework-browser
 1. Initialize the Browser library and skip browsers installation:
        > rfbrowser init --skip-browsers
 1. Install browser binaries separately according to <a href="https://playwright.dev/docs/browsers/#installing-browsers" target="_blank">Playwright</a> instructions. Example:
        > PLAYWRIGHT_BROWSERS_PATH=$HOME/pw-browsers npx playwright install
 1. Run test with PLAYWRIGHT_BROWSERS_PATH set. Example:
        > PLAYWRIGHT_BROWSERS_PATH=$HOME/pw-browsers robot path/to/test

</details>
<br/>

<h1 id="update">Updating</h1>
<details><summary>The update procedure depends on which way the library is installed, with or without the browser binaries...</summary>
<br/>

## Bundled
 1. Install Browser library from <a href="https://pypi.org/search/?q=robotframework-browser" target="_blank">PyPi</a> with pip:
        > pip install --upgrade robotframework-browser
 1. Clean old browser binaries and node dependencies:
        > rfbrowser clean-node
 1. Initialize the Browser library with new node dependencies:
        > rfbrowser init

## Separate
 1. Install Browser library from <a href="https://pypi.org/search/?q=robotframework-browser" target="_blank">PyPi</a> with pip:
        > pip install --upgrade robotframework-browser
 1. Clean node dependencies:
        > rfbrowser clean-node
 1. Initialize the Browser library with new node dependencies:
        > rfbrowser init --skip-browsers
 1. Install browser binaries separately according <a href="https://playwright.dev/docs/browsers/#installing-browsers" target="_blank">Playwright</a> instructions. Example:
        > PLAYWRIGHT_BROWSERS_PATH=$HOME/pw-browsers npx playwright install
 1. Run test with PLAYWRIGHT_BROWSERS_PATH set. Example:
        > PLAYWRIGHT_BROWSERS_PATH=$HOME/pw-browsers robot path/to/test</details>
</details>
<br/>


<h1 id="uninstall">Uninstalling</h1>

<details><summary>The uninstall procedure is the same for both installation methods...</summary> (but if browser binaries are managed separately, the user must delete browser binaries manually).<br><br>

 1. Clean old browser binaries and node dependencies:
        > rfbrowser clean-node
 1. Uninstall with pip:
        > pip uninstall robotframework-browser
 1. If browser binaries are managed separately, the user must delete binaries manually. Example:
        > rm -rf $HOME/pw-browsers
`)

export default {
  components: {
    PageBlock
  },
  data() {
    return {
      pages: [
        {
          title: "Introduction",
          text_block: true,
          tab_box: false,
          member_box: false,
          feature_box: false,
          data: {
            text: {
              twitter: false,
              header: "Introduction",
              text: introText

            }
          }
        },
        {
          title: "Installation",
          text_block: true,
          tab_box: false,
          member_box: false,
          feature_box: false,
          data: {
            text: {
              twitter: false,
              header: "Installation",
              text: installText

            }
          }
        },
        {
          title: "RoboCon-Talk",
          text_block: true,
          tab_box: false,
          member_box: false,
          feature_box: false,
          data: {
            text: {
              twitter: false,
              header: "Intro-Talk",
              text: `<p>The Browser team gave this introduction talk at RoboCon 2021.</p>
              <iframe  width=640 height=360 src="https://www.youtube-nocookie.com/embed/3BNVS6uiFeo" title="Browser-Intro-Talk" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              `
            }
          }
        },

        {
          title: "Architecture",
          text_block: false,
          tab_box: false,
          feature_box: true,
          twitter: false,
          hide_from_nav: true,
          data: {
            text: [
              {
                header: "🚀SPEED",
                text:
                  "<p>Robot Framework's Browser library is fast! With its direct API to your browser, designed for high performance testing, fast feedback is now only limited by the speed of the test object.</p> <p>With its innovative Context concept, a clean browser session starts within less than 10 milliseconds! </p><p>Learn more about <a href='https://marketsquare.github.io/robotframework-browser/Browser.html#Browser%2C%20Context%20and%20Page' target='_blank'>Browser/Contexts/Pages</a>. </p>Browser library is designed to run headless first and brings a ready-to-test docker image to scale your test environments with your needs.</p>"
              },
              {
                header: "✅RELIABILITY",
                text:
                  "<p>The <code>Wait Until</code> and <code>Sleep</code> keywords belong to the past.</p> <p>The Browser library automatically waits for the elements of the page and interacts with them when they are ready for interaction.</p> <p>Flaky tests, that sometimes PASS and sometimes FAIL, are drastically reduced and confidence in test automation increases!</p> <p>Find real errors instead of fixing your tests.</p> "
              },
              {
                header: "🔬VISIBILITY",
                text: "<p>Robot Framework's Browser library utilizes a JavaScript-based technology called Playwright. Playwright connects directly to the browser's API and has <b>full control</b> of the browser and its content. With the <code>Execute JavaScript</code> keyword you can directly manipulate and access all JavaScript objects on the page.</p> <p>Browser also has access to the Network Traffic between page and server and gives the user the possibility to interact with the server via HTTP calls from the same browser session.</p> <p>You have never been closer to your test object!</p>"
              }
            ]
          }
        },
        {
          title: "Examples",
          text_block: false,
          tab_box: false,
          feature_box: false,
          data: {
            //Different component, TODO: implement in reproducible component
          }
        },
        {
          title: "Community",
          text_block: true,
          community_block: true,
          feature_box: false,
          data: {
            text: {
              header: "Community",
              text: "Join the Browser community and help us shape its development."
            },
            items: [
              {
                title: 'community',
                items: [
                  {
                    img: require("@/assets/img/ROBOTFW_Mark_Black_LOW.png"),
                    title: 'Forum',
                    href: 'https://forum.robotframework.org/c/libraries/browser',
                    text: "Browser library's section on the Robot Framework forum."
                  },
                  {
                    img: require("@/assets/img/slack.png"),
                    title: 'Slack',
                    href: 'http://robotframework.slack.com',
		            text: 'Community team chat. Get an <a href="https://rf-invite.herokuapp.com/" target="_blank">invite to the workspace.</a>. Then join <a href="https://robotframework.slack.com/#browser">our channel #browser</a>.'
                  }
                ]
              }
            ]
          }
        },
        {
          title: "Training",
          text_block: true,
          community_block: true,
          feature_box: false,
          data: {
            text: {
              header: "Training",
              text: 'Learn to use the tool in a workshop.'
            },
            items: [
              {
                title: 'community',
                items: [
                  {
                    img: require("@/assets/img/sponsors/reaktor.jpg"),
                    title: 'Robot Framework Browser -työpaja 🇫🇮',
                    href: 'https://www.reaktor.com/training/robot-framework-browser-tyopaja/',
                    text: "Puolipäivää kestävän kurssin aikana tutustutaan Robot Framework Browser -kirjaston ominaisuuksiin tiiviinä pakettina."
                  }
                ]
              }
            ]
          }
        },

        {
          title: "Keyword Docs",
          text_block: true,
          tab_box: false,
          url: 'https://marketsquare.github.io/robotframework-browser/Browser.html',
          feature_box: false
        },
        {
          title: "Github Project",
          text_block: true,
          tab_box: false,
          url: 'https://github.com/MarketSquare/robotframework-browser#robotframework-browser',
          feature_box: false
        },
        {
          title: "Robot Framework",
          text_block: true,
          tab_box: false,
          url: 'https://robotframework.org/',
          feature_box: false
        },
        {
          title: "Playwright",
          text_block: true,
          tab_box: false,
          url: 'https://playwright.dev/',
          feature_box: false
        },
      ]
    };
  }
};
</script>
