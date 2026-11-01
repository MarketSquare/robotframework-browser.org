*** Settings ***
Documentation       Loop: Record Selector picks the login button, then switches to the CSS selector.
Resource            video.resource

Test Teardown       End A Failed Session


*** Variables ***
${CAR}      http://car.keyword-driven.de


*** Test Cases ***
Loop Record Selector
    # Right of the login form; render.sh crops the video to form and toolbar.
    ${video} =    Open Video Page    ${CAR}    toolbar_x=780    toolbar_y=40
    ${selector} =    Promise To    Record Selector    Login button    idle_timeout=1 minute
    Wait For Function    () => window.__rfbToolbarState && window.__rfbToolbarState.phase === 'picking'
    Sleep    0.8s
    Point At    id=input_username
    Sleep    0.5s
    Point At    id=input_password
    Sleep    0.5s
    Point At    id=button_login
    Sleep    0.6s
    Mouse Button    click
    Wait For Function    () => window.__rfbToolbarState.phase === 'picked' && !!window.__rfbToolbarState.count
    Sleep    1.5s
    Click Toolbar    () => window.toolbarRoot.getElementById('selGens').children[1]
    Wait For Function    () => window.__rfbToolbarState.generator === 'css' && !!window.__rfbToolbarState.count
    Sleep    1.5s
    Point At Toolbar    () => window.toolbarRoot.getElementById('selUse')
    Sleep    2.6s
    Mouse Button    click
    Wait For    ${selector}
    Save Video As    ${video}    loop-record-selector
