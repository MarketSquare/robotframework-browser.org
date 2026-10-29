*** Settings ***
Documentation       Record Keywords: several keywords in one session, Undo, the minimized toolbar.
Resource            video.resource

Test Teardown       End A Failed Session


*** Test Cases ***
Recording Session
    ${video} =    Open Video Page    ${SITE}/docs/start/getting-started
    Sleep    1s
    ${session} =    Promise To    Record Keywords    ${RAW}/session.resource    idle_timeout=1 minute
    Wait For Toolbar
    Sleep    1s
    Click Toolbar Button    new
    Click Toolbar Button    nameInput
    Type Slowly    Open The Assertions Guide
    Keyboard Key    press    Enter
    Wait For Recording
    Sleep    1s
    Click Slowly    nav.rail >> role=link[name="Assertions"]
    # A click by mistake - Undo takes it back.
    Click Slowly    main h1
    Sleep    1s
    Click Toolbar Button    undo
    Sleep    1.2s
    Click Toolbar Button    finish
    Wait For Function    () => window.__rfbToolbarState.state === 'idle' && !window.__rfbToolbarState.pending
    Sleep    1.2s
    Click Toolbar Button    collapse
    Sleep    1s
    Click Toolbar Button    headNew
    Click Toolbar Button    nameInput
    Type Slowly    Switch The Colour Theme
    Keyboard Key    press    Enter
    Wait For Recording
    Sleep    0.8s
    Click Slowly    header >> role=button[name*="colour theme"]
    Sleep    1.5s
    Click Toolbar Button    headSave
    Wait For Function    () => window.__rfbToolbarState.state === 'idle' && !window.__rfbToolbarState.pending
    Sleep    1s
    Click Toolbar Button    stop
    Wait For    ${session}
    Sleep    1.2s
    Save Video As    ${video}    session
