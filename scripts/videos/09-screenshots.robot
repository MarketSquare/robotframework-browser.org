*** Settings ***
Documentation       Stills of the recorder toolbar for the documentation, at twice the pixel density.
Resource            video.resource

Test Setup          Open Screenshot Page
Test Teardown       Run Keywords    End A Failed Session    AND    Close Context


*** Variables ***
${CAR}          http://car.keyword-driven.de
${IMAGES}       ${CURDIR}/../../public/images/recorder
${ACCOUNT}      file://${CURDIR}/pages/create-account.html


*** Test Cases ***
Recording With Syntax Colours
    ${recording} =    Start Recording    Register At The Shop
    Fill Text    id=input_username    jane@example.com
    Fill Text    id=input_password    two${SPACE}${SPACE}spaces and \${HOME}
    Click    id=button_login
    Wait For Function    () => window.__rfbToolbarState.calls.length >= 3
    Make Argument Of Value    1    user
    Shoot Toolbar    toolbar-recording
    Stop    ${recording}

Argument Dialog
    # Out of the dialog's way: the dialog opens in the middle of the page.
    Evaluate JavaScript    ${None}
    ...    () => sessionStorage.setItem('rfb.toolbar.position', JSON.stringify({x: 5000, y: 5000}))
    Go To    ${ACCOUNT}
    ${recording} =    Start Recording    Create Account
    Fill Text    id=email    jane@example.com
    Wait For Function    () => window.__rfbToolbarState.calls.length >= 1
    Click Toolbar    () => [...window.toolbarRoot.querySelectorAll('.cell.pick')].pop()
    Evaluate JavaScript    ${None}
    ...    () => { const t = window.toolbarRoot.getElementById('argValue'); t.focus(); t.setSelectionRange(0, 4); t.dispatchEvent(new Event('select')); }
    Click Toolbar Button    argName
    Type Slowly    name
    Click Toolbar Button    argDefault
    Shoot Dialog    toolbar-argument-dialog
    Stop    ${recording}

Replace Offer
    Go To    ${ACCOUNT}
    ${recording} =    Start Recording    Create Account
    Fill Text    id=email    jane@example.com
    Fill Text    id=email-confirm    jane@example.com
    Wait For Function    () => window.__rfbToolbarState.calls.length >= 2
    Evaluate JavaScript    ${None}
    ...    () => window.__rfbCommand({cmd: 'argument', call: 0, value: 1, start: 0, end: 4, name: 'name', raw: 'jane@example.com', useDefault: false})
    Wait For Function    () => !!window.__rfbToolbarState.offer
    Shoot Toolbar    toolbar-offer
    Stop    ${recording}

Paused
    ${recording} =    Start Recording    Log In Later
    Fill Text    id=input_username    demo
    Wait For Function    () => window.__rfbToolbarState.calls.length >= 1
    Click Toolbar Button    pause
    Wait For Function    () => window.__rfbToolbarState.paused === true && !window.__rfbToolbarState.pending
    Shoot Toolbar    toolbar-paused
    Stop    ${recording}

Selector Picked
    ${selector} =    Promise To    Record Selector    Login button    idle_timeout=1 minute
    Wait For Function    () => window.__rfbToolbarState && window.__rfbToolbarState.phase === 'picking'
    Click    id=button_login
    Wait For Function    () => window.__rfbToolbarState.phase === 'picked' && !!window.__rfbToolbarState.count
    Shoot Toolbar    selector-picked
    Evaluate JavaScript    ${None}    () => window.__rfbCommand({cmd: 'stop'})
    Run Keyword And Expect Error    *cancelled*    Wait For    ${selector}

Idle And Minimized
    ${session} =    Promise To    Record Keywords    ${None}    idle_timeout=1 minute
    Wait For Toolbar
    Sleep    0.5s
    Shoot Toolbar    toolbar-idle
    Click Toolbar Button    collapse
    Sleep    0.5s
    Shoot Toolbar    toolbar-minimized
    Stop    ${session}


*** Keywords ***
Open Screenshot Page
    ${lib} =    Get Library Instance    Browser
    Evaluate    setattr($lib, "recorder_allows_headless", True)
    New Browser    chromium    headless=True
    New Context    viewport={'width': 960, 'height': 540}    deviceScaleFactor=2    colorScheme=light
    Add Video Helpers    5000    110
    New Page    ${CAR}

Start Recording
    [Arguments]    ${name}
    ${recording} =    Promise To    Record Keyword    ${name}    ${None}    idle_timeout=1 minute
    Wait For Toolbar
    Wait For Recording
    RETURN    ${recording}

Stop
    [Arguments]    ${recording}
    Evaluate JavaScript    ${None}    () => window.__rfbCommand({cmd: 'stop'})
    Wait For    ${recording}

Prepare Still
    [Documentation]    No pointer, no hover, the recording dot fully lit.
    Mouse Move    2    538
    Evaluate JavaScript    ${None}
    ...    () => { const c = document.getElementById('video-cursor'); if (c) c.style.display = 'none'; window.toolbarRoot.querySelectorAll('.dot').forEach((d) => { d.style.animation = 'none'; }); }
    Sleep    0.4s

Shoot Toolbar
    [Documentation]    The toolbar panel, cut exactly at its edges.
    [Arguments]    ${name}
    Prepare Still
    ${box} =    Evaluate JavaScript    ${None}
    ...    () => { const r = window.toolbarRoot.getElementById('panel').getBoundingClientRect(); return {x: r.x, y: r.y, width: r.width, height: r.height}; }
    Take Screenshot    ${IMAGES}/${name}.png    crop=${box}

Shoot Dialog
    [Arguments]    ${name}
    Prepare Still
    ${box} =    Evaluate JavaScript    ${None}
    ...    () => { const r = window.toolbarRoot.querySelector('#argModal .dialog').getBoundingClientRect(); return {x: r.x, y: r.y, width: r.width, height: r.height}; }
    Take Screenshot    ${IMAGES}/${name}.png    crop=${box}
