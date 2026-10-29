*** Settings ***
Documentation       Part of a selector becomes a Keyword Argument.
Resource            video.resource

Test Teardown       End A Failed Session


*** Test Cases ***
Argument From A Selector
    ${video} =    Open Video Page    ${SITE}/docs/start/getting-started
    Sleep    1s
    ${recording} =    Promise To    Record Keyword    Open A Docs Chapter    ${RAW}/argument-from-a-selector.resource
    ...    idle_timeout=1 minute
    Wait For Toolbar
    Wait For Recording
    Click Slowly    nav.rail >> role=link[name="Assertions"]
    Sleep    1.5s
    Click Toolbar    () => window.toolbarRoot.querySelector('.cell.pick')
    Sleep    0.6s
    Point At Toolbar    () => window.toolbarRoot.getElementById('argValue')
    # Marks the chapter name in the selector, as dragging over it would.
    Evaluate JavaScript    ${None}
    ...    () => { const t = window.toolbarRoot.getElementById('argValue'); const at = t.value.indexOf('Assertions'); t.focus(); t.setSelectionRange(at, at + 10); t.dispatchEvent(new Event('select')); }
    Sleep    1s
    Click Toolbar Button    argName
    Type Slowly    chapter
    Sleep    0.4s
    Click Toolbar Button    argOk
    Wait For Function    () => window.__rfbToolbarState.arguments.length === 1
    Sleep    2.5s
    Click Toolbar Button    stop
    Wait For    ${recording}
    Sleep    1s
    Save Video As    ${video}    argument-from-a-selector
