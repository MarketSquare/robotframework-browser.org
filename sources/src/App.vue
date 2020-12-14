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

Browser library powered by <a href="https://playwright.dev/" target="_blank">Playwright</a> provides.

🚀 Speed, ✅ reliability and 🔬 visibility.


- Conscise assertions.
- Precise and fast browser window and tab control.
- Chainable selector strategies.
- Good shadow DOM support.
- Easy mobile device descriptors.
- Sending HTTP requests.


See <a href="https://marketsquare.github.io/robotframework-browser/Browser.html" target="_blank">keyword documentation</a> and our <a href="https://github.com/MarketSquare/robotframework-browser#robotframework-browser" target="_blank">project on Github</a>.


Get it now!


 1. Install <a href="https://nodejs.org/en/download/" target="_blank">Node.js®</a>
 1. Install Browser library from <a href="https://pypi.org/search/?q=robotframework-browser" target="_blank">PyPi</a> with pip:
        > pip install robotframework-browser
 1. Initialize the Browser library:
        > rfbrowser init

Join us for discussion and support at the <a href="https://forum.robotframework.org/c/libraries/browser" target="_blank">robotframework forum</a> and <a href="https://github.com/MarketSquare/robotframework-browser/issues" target="_blank">our GitHub issues</a>.

Use. Benefit. Contribute. Lets make the best Browser library.`)

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
                  "<p> Robot Framework Browser is fast! With its direct API to the browsers, designed for high performance testing, fast feedback is now only limited by the speed of the test object. </p> <p>With its inovative Context concept, a clean browser session is started within a less than 10 milliseconds! </p><p> Learn more about <a href='https://marketsquare.github.io/robotframework-browser/Browser.html#Browser%2C%20Context%20and%20Page' target='_blank'>Browser/Contexts/Pages</a>. </p>Browser library is designed to run headless first and brings a ready-to-test docker image to scale your test environments with your needs.</p>"
              },
              {
                header: "✅RELIABILITY",
                text:
                  "<p><code>Wait Until ...</code> and <code>Sleep</code> keywords belong to the past. </p> <p> The browser library automatically waits for the elements of the page and interacts with them when they are ready for interaction. </p> <p>Flickering tests that are sometimes PASS and sometimes FAIL are drastically reduced and confidence in test automation increases!</p> <p>Find real errors instead of fixing your tests...</p> "
              },
              {
                header: "🔬VISIBILITY",
                text: "<p> Robot Framework Browser utilizes a JavaScript based technology called Playwright. Playwright connects directly to the browsers API and has <b>full control</b> of the browser and its content. The Users has full access to all JavaScript object of the page and with the <code>Execute JavaScript</code> keyword you can directly manipulate them.</p> <p>Browser has also access to the Network Traffic between page and server and gives the user the possibility to interact with the server via HTTP calls from the same browser session.</p> <p>You have never been closer to your test object!</p>"
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

	/*
        {
          title: "Documentation",
          text_block: true,
          tab_box: true,
          feature_box: false,
          data: {
            text: {
              header: "Documentation",
              text:
                '<p> Want to get started? Looking for a way to do things? Here are the most important documentation resources needed to work with Robot Framework. Notice that individual <a href="#libraries">libraries</a> and <a href="#tools">tools</a> in the ecosystem have their own documentation that is typically accessed via their project pages. </p> <p> <a href="https://github.com/robotframework/robotframework.github.com" target="_blank">Let us know</a> if useful links are missing from the list. </p>'
            },
            tabs: [
              {
                title: "Getting started",
                items: [
                  {
                    title: "Installation Instructions",
                    href:
                      "https://github.com/robotframework/robotframework/blob/master/INSTALL.rst",
                    text:
                      "If you are familiar with Python and pip, just run <code>pip install robotframework</code>. Notice that external libraries and tools need to be installed separately."
                  },
                  {
                    title: "Introduction Slides",
                    href:
                      "http://www.slideshare.net/pekkaklarck/robot-framework-introduction",
                    text: "Generic Robot Framework introduction slides."
                  },
                  {
                    title: "Quick Start Guide",
                    href:
                      "https://github.com/robotframework/QuickStartGuide/blob/master/QuickStart.rst",
                    text:
                      "Introduces the most important features of Robot Framework and acts as an executable demo."
                  },
                  {
                    title: "User Guide",
                    href:
                      "http://robotframework.org/robotframework/#user-guide",
                    text:
                      "Reference manual explaining all Robot Framework features in detail."
                  },
                  {
                    title: "How to write good test cases",
                    href:
                      "https://github.com/robotframework/HowToWriteGoodTestCases/blob/master/HowToWriteGoodTestCases.rst",
                    text:
                      "Guidelines for writing good test cases using Robot Framework."
                  },
                  {
                    title: "Dos And Don'ts",
                    href:
                      "http://www.slideshare.net/pekkaklarck/robot-framework-dos-and-donts",
                    text:
                      "Slide set loosely based on 'How to write good test cases' guidelines."
                  },
                  {
                    title: "Public API",
                    href: "http://robot-framework.readthedocs.org/en/latest/",
                    text:
                      "Public API for writing your own tools against Robot Framework."
                  },
                  {
                    title: "Robohub",
                    href: "https://hub.robocorp.com/robotic-process-automation/basics-of-rpa/",
                    text:
                      "RPA tutorials and guidelines"
                  }
                ]
              },
              {
                title: "Demos",
                items: [
                  {
                    title: "Web Demo",
                    href: "https://github.com/robotframework/WebDemo",
                    text:
                      "Demonstrates how to create tests and higher level keywords. The system under test is a simple web page that is tested using SeleniumLibrary."
                  },
                  {
                    title: "Robot Demo",
                    href: "https://github.com/robotframework/RobotDemo",
                    text:
                      "Demonstrates how to create tests and test libraries. The system under test is a simple calculator that is tested using a custom library."
                  },
                  {
                    title: "Quick Start Guide",
                    href:
                      "https://github.com/robotframework/QuickStartGuide/blob/master/QuickStart.rst",
                    text:
                      "Introduces the most important features of Robot Framework and acts as an executable demo."
                  },
                  {
                    title: "ATDD with Robot Framework",
                    href:
                      "https://code.google.com/p/atdd-with-robot-framework/",
                    text:
                      "How to use Robot Framework for Acceptance Test Driven Development (ATDD) a.k.a. Specification by Example."
                  },
                  {
                    title: "Using C with Robot Framework",
                    href: "https://bitbucket.org/robotframework/cdemo",
                    text:
                      "This simple example demonstrates how to use C language from Robot Framework test libraries."
                  },
                  {
                    title: "Remote interface demo",
                    href: "https://github.com/jg8481/robotframework-scala-remote-library",
                    text:
                      "Example demonstrates how to use Robot Framework's <a href='https://github.com/robotframework/RemoteInterface' target='_blank'>Remote interface</a> to call test libraries written in any programming language."
                  },
                ]
              },
              {
                title: "Videos",
                items: [
                  {
                    src: "https://www.youtube.com/embed/T0SK5A1rwdk"
                  },
                  {
                    src: "https://www.youtube.com/embed/LhUre0hu8I8"
                  },
                  {
                    src: "https://www.youtube.com/embed/819sBbvT6gM"
                  },
                  {
                    title: "",
                    src: "//player.vimeo.com/video/93124154",
                    href: "",
                    text: ""
                  },
                  {
                    title: "",
                    src: "//player.vimeo.com/video/94638895",
                    href: "",
                    text: ""
                  },
                  {
                    title: "",
                    src: "//player.vimeo.com/video/96527858",
                    href: "",
                    text: ""
                  },
                  {
                    title: "Much more at robocon.io!",
                    href: "https://robocon.io/#previous-talks",
                    text: ""
                  }
                ]
              },
              {
                title: "Online courses",
                items: [
                  {
                    title: "eTestingAcademy",
                    href: "http://www.etestingacademy.com/",
                    text:
                      "Offers online courses to groom you from manual engineer to professional test automation developer with Selenium, Appium and Robot Framework."
                  },
                  {
                    title: "Introduction to Robot Framework (FREE)",
                    href: "https://testautomationu.applitools.com/robot-framework-tutorial/",
                    text:
                      "Want to learn Robot Framework? Learn the fundamentals in 1 hour with Test Automation University’s FREE course!"
                  },
                  {
                    title: "Robotframeworktutorial.com",
                    href: "http://www.robotframeworktutorial.com",
                    text:
                      "Offers several paid video training courses that have got 3000+ students in over 90 countries up and running very quickly."
                  }
                ]
              }
            ]
          }
        }, */
        {
          title: "Community",
          text_block: true,
          community_block: true,
          feature_box: false,
          data: {
            text: {
              header: "Community",
              text: "Join the Browser community and help us shape its deveopment."
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
                  },
		  /*
                  {
                    title: "@robotframework",
                    href: "http://twitter.com/robotframework",
                    text: "Announcements in Twitter."
                  },
                  {
                    title: "Stack Overflow",
                    href:
                      "http://stackoverflow.com/questions/tagged/robotframework",
                    text:
                      "Questions in Stack Overflow tagged with Robot Framework."
                  },
		  */
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
/* unnecessary sidebar stuff               {
          title: "Forum",
          text_block: true,
          tab_box: false,
          url: 'http://forum.robotframework.org',
          feature_box: false
        },
        {
          title: "Shop",
          text_block: true,
          tab_box: false,
          url: 'https://reddyshop.co/robotframework/',
          feature_box: false
        },
        {
          title: "RPA",
          text_block: true,
          tab_box: false,
          url: 'https://robotframework.org/rpa/',
          feature_box: false
        }
	*/
      ]
    };
  }
};
</script>
