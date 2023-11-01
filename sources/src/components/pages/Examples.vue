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
          <b-tab title="Example 1 with Robot Framework">
            <div class="highlight"><pre><span></span><span class="gh">*** Settings ***</span>
<span class="kn">Library</span><span class="p">    </span><span class="nn">Browser</span>


<span class="gh">*** Test Cases ***</span>
<span class="gu">Has Title</span>
<span class="p">    </span><span class="nf">New Page</span><span class="p">    </span><span class="s">https://playwright.dev/</span>
<span class="p">    </span><span class="nf">Get Title</span><span class="p">    </span><span class="s">contains</span><span class="p">    </span><span class="s">Playwright</span>

<span class="gu">Get Started Link</span>
<span class="p">    </span><span class="nf">New Page</span><span class="p">    </span><span class="s">https://playwright.dev/</span>
<span class="p">    ${</span><span class="nv">element</span><span class="p">}=    </span><span class="nf">Get Element By Role</span><span class="p">    </span><span class="s">LINK</span><span class="p">    </span><span class="s">name=Get started</span>
<span class="p">    </span><span class="nf">Click</span><span class="p">    ${</span><span class="nv">element</span><span class="p">}</span>
<span class="p">    ${</span><span class="nv">heading</span><span class="p">}=    </span><span class="nf">Get Element By Role</span><span class="p">    </span><span class="s">HEADING</span><span class="p">    </span><span class="s">name=Installation</span>
<span class="p">    </span><span class="nf">Get Element States</span><span class="p">    ${</span><span class="nv">heading</span><span class="p">}    </span><span class="s">contains</span><span class="p">    </span><span class="s">visible</span>

<span class="gu">Get Started Link [Alternative]</span>
<span class="p">    </span><span class="nf">New Page</span><span class="p">    </span><span class="s">https://playwright.dev/</span>
<span class="p">    </span><span class="nf">Click</span><span class="p">    </span><span class="s">a &gt;&gt; &quot;Get started&quot;</span>
<span class="p">    </span><span class="nf">Get Element States</span><span class="p">    </span><span class="s">h1 &gt;&gt; &quot;Installation&quot;</span><span class="p">    </span><span class="s">contains</span><span class="p">    </span><span class="s">visible</span>

<span class="gu">Playwright Test</span>
<span class="p">    </span><span class="nf">New Page</span><span class="p">    </span><span class="s">https://playwright.dev/</span>
<span class="p">    </span><span class="nf">Get Title</span><span class="p">    </span><span class="s">matches</span><span class="p">   </span><span class="s">Playwright</span>
<span class="p">    </span><span class="nf">Get Attribute</span><span class="p">    </span><span class="s">&quot;Get started&quot;</span><span class="p">    </span><span class="s">href</span><span class="p">    </span><span class="s">==</span><span class="p">    </span><span class="s">/docs/intro</span>
<span class="p">    </span><span class="nf">Click</span><span class="p">    </span><span class="s">&quot;Get started&quot;</span>
<span class="p">    </span><span class="nf">Get Url</span><span class="p">    </span><span class="s">matches</span><span class="p">    </span><span class="s">.*intro</span>
</pre></div>
          </b-tab>
          <b-tab title="Example 1 with Playwright">
            <div class="highlight"><pre><span></span><span class="k">import</span><span class="w"> </span><span class="p">{</span><span class="w"> </span><span class="nx">test</span><span class="p">,</span><span class="w"> </span><span class="nx">expect</span><span class="w"> </span><span class="p">}</span><span class="w"> </span><span class="kr">from</span><span class="w"> </span><span class="s1">&#39;@playwright/test&#39;</span><span class="p">;</span>

<span class="nx">test</span><span class="p">(</span><span class="s1">&#39;has title&#39;</span><span class="p">,</span><span class="w"> </span><span class="k">async</span><span class="w"> </span><span class="p">({</span><span class="w"> </span><span class="nx">page</span><span class="w"> </span><span class="p">})</span><span class="w"> </span><span class="p">=&gt;</span><span class="w"> </span><span class="p">{</span>
<span class="w">  </span><span class="k">await</span><span class="w"> </span><span class="nx">page</span><span class="p">.</span><span class="kr">goto</span><span class="p">(</span><span class="s1">&#39;https://playwright.dev/&#39;</span><span class="p">);</span>
<span class="w">  </span><span class="k">await</span><span class="w"> </span><span class="nx">expect</span><span class="p">(</span><span class="nx">page</span><span class="p">).</span><span class="nx">toHaveTitle</span><span class="p">(</span><span class="sr">/Playwright/</span><span class="p">);</span>
<span class="p">});</span>

<span class="nx">test</span><span class="p">(</span><span class="s1">&#39;get started link&#39;</span><span class="p">,</span><span class="w"> </span><span class="k">async</span><span class="w"> </span><span class="p">({</span><span class="w"> </span><span class="nx">page</span><span class="w"> </span><span class="p">})</span><span class="w"> </span><span class="p">=&gt;</span><span class="w"> </span><span class="p">{</span>
<span class="w">  </span><span class="k">await</span><span class="w"> </span><span class="nx">page</span><span class="p">.</span><span class="kr">goto</span><span class="p">(</span><span class="s1">&#39;https://playwright.dev/&#39;</span><span class="p">);</span>
<span class="w">  </span><span class="k">await</span><span class="w"> </span><span class="nx">page</span><span class="p">.</span><span class="nx">getByRole</span><span class="p">(</span><span class="s1">&#39;link&#39;</span><span class="p">,</span><span class="w"> </span><span class="p">{</span><span class="w"> </span><span class="nx">name</span><span class="o">:</span><span class="w"> </span><span class="s1">&#39;Get started&#39;</span><span class="w"> </span><span class="p">}).</span><span class="nx">click</span><span class="p">();</span>
<span class="w">  </span><span class="k">await</span><span class="w"> </span><span class="nx">expect</span><span class="p">(</span><span class="nx">page</span><span class="p">.</span><span class="nx">getByRole</span><span class="p">(</span><span class="s1">&#39;heading&#39;</span><span class="p">,</span><span class="w"> </span><span class="p">{</span><span class="w"> </span><span class="nx">name</span><span class="o">:</span><span class="w"> </span><span class="s1">&#39;Installation&#39;</span><span class="w"> </span><span class="p">})).</span><span class="nx">toBeVisible</span><span class="p">();</span>
<span class="p">});</span>

<span class="nx">test</span><span class="p">(</span><span class="s1">&#39;Playwright Test&#39;</span><span class="p">,</span><span class="w"> </span><span class="k">async</span><span class="w"> </span><span class="p">({</span><span class="w"> </span><span class="nx">page</span><span class="w"> </span><span class="p">})</span><span class="w"> </span><span class="p">=&gt;</span><span class="w"> </span><span class="p">{</span>
<span class="w">  </span><span class="k">await</span><span class="w"> </span><span class="nx">page</span><span class="p">.</span><span class="kr">goto</span><span class="p">(</span><span class="s1">&#39;https://playwright.dev/&#39;</span><span class="p">);</span>
<span class="w">  </span><span class="k">await</span><span class="w"> </span><span class="nx">expect</span><span class="p">(</span><span class="nx">page</span><span class="p">).</span><span class="nx">toHaveTitle</span><span class="p">(</span><span class="sr">/Playwright/</span><span class="p">);</span>
<span class="w">  </span><span class="kd">const</span><span class="w"> </span><span class="nx">getStarted</span><span class="w"> </span><span class="o">=</span><span class="w"> </span><span class="nx">page</span><span class="p">.</span><span class="nx">getByText</span><span class="p">(</span><span class="s1">&#39;Get started&#39;</span><span class="p">);</span>
<span class="w">  </span><span class="k">await</span><span class="w"> </span><span class="nx">expect</span><span class="p">(</span><span class="nx">getStarted</span><span class="p">).</span><span class="nx">toHaveAttribute</span><span class="p">(</span><span class="s1">&#39;href&#39;</span><span class="p">,</span><span class="w"> </span><span class="s1">&#39;/docs/intro&#39;</span><span class="p">);</span>
<span class="w">  </span><span class="k">await</span><span class="w"> </span><span class="nx">getStarted</span><span class="p">.</span><span class="nx">click</span><span class="p">();</span>
<span class="w">  </span><span class="k">await</span><span class="w"> </span><span class="nx">expect</span><span class="p">(</span><span class="nx">page</span><span class="p">).</span><span class="nx">toHaveURL</span><span class="p">(</span><span class="sr">/.*intro/</span><span class="p">);</span>
<span class="p">});</span>
</pre></div>
          </b-tab>
        </b-tabs>
        </div>
        <div class="col-md-12 order-md-2 order-lg-1">
          <b-tabs cards pills class="nav-fill card " v-model="tabIndex" @input="changeTabText(tabIndex)">
          <b-tab title="Example 2 with Robot Framework">
            <div class="highlight"><pre><span></span><span class="gh">*** Settings ***</span>
<span class="kn">Library</span><span class="p">     </span><span class="nn">Browser</span>


<span class="gh">*** Test Cases ***</span>
<span class="gu">Test Eight Components</span>
<span class="p">    </span><span class="nf">New Browser</span><span class="p">    </span><span class="s">chromium</span><span class="p">    </span><span class="s">headless=No</span>
<span class="p">    </span><span class="nf">New Page</span><span class="p">    </span><span class="s">https://www.selenium.dev/selenium/web/web-form.html</span>
<span class="p">    </span><span class="nf">Set Browser Timeout</span><span class="p">    </span><span class="s">0.5 sec</span>
<span class="p">    </span><span class="nf">Get Title</span><span class="p">    </span><span class="s">==</span><span class="p">    </span><span class="s">Web form</span>
<span class="p">    </span><span class="nf">Type Text</span><span class="p">    </span><span class="s">[name=&quot;my-text&quot;]</span><span class="p">    </span><span class="s">Selenium</span>
<span class="p">    </span><span class="nf">Click</span><span class="p">    </span><span class="s">button</span>
<span class="p">    </span><span class="nf">Get Text</span><span class="p">    </span><span class="s">id=message</span><span class="p">    </span><span class="s">==</span><span class="p">    </span><span class="s">Received!</span>
</pre></div>
          </b-tab>
          <b-tab title="Example 2 with Cypress">
            <div class="highlight"><pre><span></span><span class="nx">describe</span><span class="p">(</span><span class="s1">&#39;My First Test&#39;</span><span class="p">,</span><span class="w"> </span><span class="p">()</span><span class="w"> </span><span class="p">=&gt;</span><span class="w"> </span><span class="p">{</span>
<span class="w">    </span><span class="nx">it</span><span class="p">(</span><span class="s1">&#39;Gets, types and asserts&#39;</span><span class="p">,</span><span class="w"> </span><span class="p">()</span><span class="w"> </span><span class="p">=&gt;</span><span class="w"> </span><span class="p">{</span>
<span class="w">      </span><span class="nx">cy</span><span class="p">.</span><span class="nx">visit</span><span class="p">(</span><span class="s1">&#39;https://example.cypress.io&#39;</span><span class="p">)</span>
<span class="w">      </span><span class="nx">cy</span><span class="p">.</span><span class="nx">contains</span><span class="p">(</span><span class="s1">&#39;type&#39;</span><span class="p">).</span><span class="nx">click</span><span class="p">()</span>
<span class="w">      </span><span class="nx">cy</span><span class="p">.</span><span class="nx">url</span><span class="p">().</span><span class="nx">should</span><span class="p">(</span><span class="s1">&#39;include&#39;</span><span class="p">,</span><span class="w"> </span><span class="s1">&#39;/commands/actions&#39;</span><span class="p">)</span>
<span class="w">      </span><span class="nx">cy</span><span class="p">.</span><span class="nx">get</span><span class="p">(</span><span class="s1">&#39;.action-email&#39;</span><span class="p">).</span><span class="nx">type</span><span class="p">(</span><span class="s1">&#39;fake@email.com&#39;</span><span class="p">)</span>
<span class="w">      </span><span class="nx">cy</span><span class="p">.</span><span class="nx">get</span><span class="p">(</span><span class="s1">&#39;.action-email&#39;</span><span class="p">).</span><span class="nx">should</span><span class="p">(</span><span class="s1">&#39;have.value&#39;</span><span class="p">,</span><span class="w"> </span><span class="s1">&#39;fake@email.com&#39;</span><span class="p">)</span>
<span class="w">    </span><span class="p">})</span>
<span class="w">  </span><span class="p">})</span>
</pre></div>
          </b-tab>
        </b-tabs>
        </div>
        <div class="col-md-12 order-md-2 order-lg-1">
          <b-tabs cards pills class="nav-fill card " v-model="tabIndex" @input="changeTabText(tabIndex)">
          <b-tab title="Example 3 with Robot Framework">
            <div class="highlight"><pre><span></span><span class="gh">*** Settings ***</span>
<span class="kn">Library</span><span class="p">     </span><span class="nn">Browser</span>


<span class="gh">*** Test Cases ***</span>
<span class="gu">Test Eight Components</span>
<span class="p">    </span><span class="nf">New Browser</span><span class="p">    </span><span class="s">chromium</span><span class="p">    </span><span class="s">headless=No</span>
<span class="p">    </span><span class="nf">New Page</span><span class="p">    </span><span class="s">https://www.selenium.dev/selenium/web/web-form.html</span>
<span class="p">    </span><span class="nf">Set Browser Timeout</span><span class="p">    </span><span class="s">0.5 sec</span>
<span class="p">    </span><span class="nf">Get Title</span><span class="p">    </span><span class="s">==</span><span class="p">    </span><span class="s">Web form</span>
<span class="p">    </span><span class="nf">Type Text</span><span class="p">    </span><span class="s">[name=&quot;my-text&quot;]</span><span class="p">    </span><span class="s">Selenium</span>
<span class="p">    </span><span class="nf">Click</span><span class="p">    </span><span class="s">button</span>
<span class="p">    </span><span class="nf">Get Text</span><span class="p">    </span><span class="s">id=message</span><span class="p">    </span><span class="s">==</span><span class="p">    </span><span class="s">Received!</span>
</pre></div>
          </b-tab>
          <b-tab title="Example 3 with Selenium (Python)">
            <div class="highlight"><pre><span></span><span class="kn">from</span> <span class="nn">selenium</span> <span class="kn">import</span> <span class="n">webdriver</span>
<span class="kn">from</span> <span class="nn">selenium.webdriver.common.by</span> <span class="kn">import</span> <span class="n">By</span>


<span class="k">def</span> <span class="nf">test_eight_components</span><span class="p">():</span>
    <span class="n">driver</span> <span class="o">=</span> <span class="n">webdriver</span><span class="o">.</span><span class="n">Chrome</span><span class="p">()</span>

    <span class="n">driver</span><span class="o">.</span><span class="n">get</span><span class="p">(</span><span class="s2">&quot;https://www.selenium.dev/selenium/web/web-form.html&quot;</span><span class="p">)</span>

    <span class="n">title</span> <span class="o">=</span> <span class="n">driver</span><span class="o">.</span><span class="n">title</span>
    <span class="k">assert</span> <span class="n">title</span> <span class="o">==</span> <span class="s2">&quot;Web form&quot;</span>

    <span class="n">driver</span><span class="o">.</span><span class="n">implicitly_wait</span><span class="p">(</span><span class="mf">0.5</span><span class="p">)</span>

    <span class="n">text_box</span> <span class="o">=</span> <span class="n">driver</span><span class="o">.</span><span class="n">find_element</span><span class="p">(</span><span class="n">by</span><span class="o">=</span><span class="n">By</span><span class="o">.</span><span class="n">NAME</span><span class="p">,</span> <span class="n">value</span><span class="o">=</span><span class="s2">&quot;my-text&quot;</span><span class="p">)</span>
    <span class="n">submit_button</span> <span class="o">=</span> <span class="n">driver</span><span class="o">.</span><span class="n">find_element</span><span class="p">(</span><span class="n">by</span><span class="o">=</span><span class="n">By</span><span class="o">.</span><span class="n">CSS_SELECTOR</span><span class="p">,</span> <span class="n">value</span><span class="o">=</span><span class="s2">&quot;button&quot;</span><span class="p">)</span>

    <span class="n">text_box</span><span class="o">.</span><span class="n">send_keys</span><span class="p">(</span><span class="s2">&quot;Selenium&quot;</span><span class="p">)</span>
    <span class="n">submit_button</span><span class="o">.</span><span class="n">click</span><span class="p">()</span>

    <span class="n">message</span> <span class="o">=</span> <span class="n">driver</span><span class="o">.</span><span class="n">find_element</span><span class="p">(</span><span class="n">by</span><span class="o">=</span><span class="n">By</span><span class="o">.</span><span class="n">ID</span><span class="p">,</span> <span class="n">value</span><span class="o">=</span><span class="s2">&quot;message&quot;</span><span class="p">)</span>
    <span class="n">value</span> <span class="o">=</span> <span class="n">message</span><span class="o">.</span><span class="n">text</span>
    <span class="k">assert</span> <span class="n">value</span> <span class="o">==</span> <span class="s2">&quot;Received!&quot;</span>

    <span class="n">driver</span><span class="o">.</span><span class="n">quit</span><span class="p">()</span>
</pre></div>
          </b-tab>
        </b-tabs>
        </div>
        <div class="col-md-12 order-md-2 order-lg-1">
          <b-tabs cards pills class="nav-fill card " v-model="tabIndex" @input="changeTabText(tabIndex)">
          <b-tab title="Example 4 with Python">
            
<div class="highlight"><pre><span></span><span class="kn">from</span> <span class="nn">Browser</span> <span class="kn">import</span> <span class="n">Browser</span>
<span class="kn">from</span> <span class="nn">Browser</span> <span class="kn">import</span> <span class="n">SupportedBrowsers</span>
<span class="kn">from</span> <span class="nn">Browser</span> <span class="kn">import</span> <span class="n">AssertionOperator</span> <span class="k">as</span> <span class="n">AO</span>

<span class="n">browser</span> <span class="o">=</span> <span class="n">Browser</span><span class="p">()</span>


<span class="k">def</span> <span class="nf">test_keyword_filtering</span><span class="p">():</span>
    <span class="n">browser</span><span class="o">.</span><span class="n">new_browser</span><span class="p">(</span><span class="n">SupportedBrowsers</span><span class="o">.</span><span class="n">chromium</span><span class="p">,</span> <span class="n">headless</span><span class="o">=</span><span class="kc">False</span><span class="p">)</span>
    <span class="n">browser</span><span class="o">.</span><span class="n">new_page</span><span class="p">(</span><span class="s2">&quot;https://robotframework-browser.org/&quot;</span><span class="p">)</span>
    <span class="k">assert</span> <span class="n">browser</span><span class="o">.</span><span class="n">get_title</span><span class="p">()</span> <span class="o">==</span> <span class="s2">&quot;Browser Library&quot;</span>
    <span class="n">browser</span><span class="o">.</span><span class="n">click</span><span class="p">(</span><span class="s1">&#39;a &gt;&gt; &quot;keyword documentation&quot;&#39;</span><span class="p">)</span>
    <span class="n">browser</span><span class="o">.</span><span class="n">switch_page</span><span class="p">(</span><span class="s2">&quot;NEW&quot;</span><span class="p">)</span>
    <span class="n">browser</span><span class="o">.</span><span class="n">get_title</span><span class="p">(</span><span class="n">AO</span><span class="o">.</span><span class="n">equals</span><span class="p">,</span> <span class="s2">&quot;Browser&quot;</span><span class="p">)</span>
    <span class="n">browser</span><span class="o">.</span><span class="n">get_url</span><span class="p">(</span><span class="n">AO</span><span class="o">.</span><span class="n">ends</span><span class="p">,</span> <span class="s2">&quot;robotframework-browser/Browser.html&quot;</span><span class="p">)</span>
    <span class="n">browser</span><span class="o">.</span><span class="n">type_text</span><span class="p">(</span><span class="s1">&#39;input[placeholder=&quot;Search&quot;]&#39;</span><span class="p">,</span> <span class="s2">&quot;Style&quot;</span><span class="p">)</span>
    <span class="n">style_elements</span> <span class="o">=</span> <span class="n">browser</span><span class="o">.</span><span class="n">get_elements</span><span class="p">(</span>
        <span class="s1">&#39;id=keyword-shortcuts-container &gt;&gt; a &gt; span:has-text(&quot;Style&quot;)&#39;</span>
    <span class="p">)</span>
    <span class="k">for</span> <span class="n">element</span> <span class="ow">in</span> <span class="n">style_elements</span><span class="p">:</span>
        <span class="k">assert</span> <span class="n">browser</span><span class="o">.</span><span class="n">get_style</span><span class="p">(</span><span class="n">element</span><span class="p">,</span> <span class="s2">&quot;background-color&quot;</span><span class="p">)</span> <span class="o">==</span> <span class="s2">&quot;rgb(255, 255, 0)&quot;</span>
    <span class="k">assert</span> <span class="nb">len</span><span class="p">(</span><span class="n">style_elements</span><span class="p">)</span> <span class="o">==</span> <span class="mi">2</span>
    <span class="n">browser</span><span class="o">.</span><span class="n">close_browser</span><span class="p">(</span><span class="s2">&quot;ALL&quot;</span><span class="p">)</span>
</pre></div>
          </b-tab>
          <b-tab title="Example 4 with Robot Framework">
            <div class="highlight"><pre><span></span><span class="gh">*** Settings ***</span>
<span class="kn">Library</span><span class="p">     </span><span class="nn">Browser</span>


<span class="gh">*** Test Cases ***</span>
<span class="gu">Test Keyword Filtering</span>
<span class="p">    </span><span class="nf">New Browser</span><span class="p">    </span><span class="s">Chromium</span><span class="p">    </span><span class="s">headless=False</span>
<span class="p">    </span><span class="nf">New Page</span><span class="p">    </span><span class="s">https://robotframework-browser.org/</span>
<span class="p">    </span><span class="nf">Get Title</span><span class="p">    </span><span class="s">==</span><span class="p">    </span><span class="s">Browser Library</span>
<span class="p">    </span><span class="nf">Click</span><span class="p">    </span><span class="s">a &gt;&gt; &quot;keyword documentation&quot;</span>
<span class="p">    </span><span class="nf">Switch Page</span><span class="p">    </span><span class="s">NEW</span>
<span class="p">    </span><span class="nf">Get Title</span><span class="p">    </span><span class="s">==</span><span class="p">    </span><span class="s">Browser</span>
<span class="p">    </span><span class="nf">Get URL</span><span class="p">    </span><span class="s">ends</span><span class="p">    </span><span class="s">robotframework-browser/Browser.html</span>
<span class="p">    </span><span class="nf">Type Text</span><span class="p">    </span><span class="s">input[placeholder=&quot;Search&quot;]</span><span class="p">    </span><span class="s">Style</span>
<span class="p">    ${</span><span class="nv">style_elements</span><span class="p">}=    </span><span class="nf">Get Elements</span><span class="p">    </span><span class="s">id=keyword-shortcuts-container &gt;&gt; a &gt; span:has-text(&quot;Style&quot;)</span>
<span class="p">    </span><span class="nf">FOR</span><span class="p">    ${</span><span class="nv">element</span><span class="p">}    </span><span class="s">IN</span><span class="p">    @{</span><span class="nv">style_elements</span><span class="p">}</span>
<span class="p">        </span><span class="nf">Get Style</span><span class="p">    ${</span><span class="nv">element</span><span class="p">}    </span><span class="s">background-color</span><span class="p">    </span><span class="s">==</span><span class="p">    </span><span class="s">rgb(255, 255, 0)</span>
<span class="p">    </span><span class="nf">END</span>
<span class="p">    </span><span class="nf">Length Should Be</span><span class="p">    ${</span><span class="nv">style_elements</span><span class="p">}    </span><span class="s">2</span>
</pre></div>
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
          text: `In this section, we've re-implemented examples from various web automation tools using Robot Framework and the Browser library.
          These original examples were taken from the tools pages. 
          This isn't to claim superiority but to demonstrate our approach using familiar examples.
          We deeply respect the projects we've referenced.
          A big thanks to the Playwright team, as our library is built on their work. We also appreciate Selenium for their longstanding contributions to web automation.
          Explore the examples to see Robot Framework's capabilities in action.`
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
