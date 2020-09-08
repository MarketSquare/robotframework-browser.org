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

const introText = marked(`Robot Framework deserves a browser automation solution that's designed for the 2020s. \n\n Browser library powered by [Playwright](https://playwright.dev/) provides.\n\n 🚀 Speed, ✅ reliability and 🔬 visibility. \n\n
    \n- Conscise assertions. \n- Precise and fast browser window and tab control. \n- Chainable selector strategies. \n- Good shadow DOM support.\n- Easy mobile device descriptors. \n- Sending HTTP requests. \n\n \n\n See [keyword documentation](https://marketsquare.github.io/robotframework-browser/Browser.html). \n\n Get it now with \`pip install robotframework-browser && rfbrowser init\` \n\n Join us for discussion and support at the [robotframework slack](https://robotframework-slack-invite.herokuapp.com) and [our github issues](https://github.com/MarketSquare/robotframework-browser/issues). \n\n Use. Benefit. Contribute. Lets make the best Browser library.`)

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
                  '<p> Robot Framework has a modular architecture that can be extended with bundled and self-made <a href="#libraries">libraries</a>. </p> <p> Data is defined in files using the syntax shown in the <a href="#examples">examples</a> below. A file containing tests or tasks creates a suite, and placing these files into directories creates a nested structure of suites. </p>'
              },
              {
                header: "✅RELIABILITY",
                text:
                  "<p> When execution is started, the framework first parses the data. It then utilizes keywords provided by the libraries to interact with the target system. Libraries can communicate with the system either directly or using other tools as drivers. </p> <p> Test or task execution is started from the command line. As a result, you get a report and log in HTML format as well as an XML output. These provide an extensive look into what your system does. </p>"
              },
              {
                header: "🔬VISIBILITY",
                img: require("@/assets/img/architecture.png"),
                img_big: require("@/assets/img/architecture_big.png"),
                text: ""
              }
            ]
          }
        },
	/*        {
          title: "Examples",
          text_block: false,
          tab_box: false,
          feature_box: false,
          data: {
            //Different component, TODO: implement in reproducible component
          }
        },
	*/
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
