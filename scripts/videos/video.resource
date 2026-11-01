*** Settings ***
Documentation       Keywords that record the documentation videos at a human pace.
...                 Needs the Browser library from the branch that has the recorder.
Library             Browser    jsextension=${CURDIR}/video-helpers.cjs
Library             OperatingSystem


*** Variables ***
${SITE}             https://robotframework-browser.org
${WIDTH}            1280
${HEIGHT}           720
${RAW}              ${CURDIR}/raw


*** Keywords ***
Open Video Page
    [Documentation]    A context that records a video of everything that follows.
    [Arguments]    ${url}    ${toolbar_x}=5000    ${toolbar_y}=5000
    ...    ${width}=${WIDTH}    ${height}=${HEIGHT}    ${scale}=1
    ${lib} =    Get Library Instance    Browser
    # The recorder refuses headless browsers; the switch exists for scripted sessions like this.
    Evaluate    setattr($lib, "recorder_allows_headless", True)
    New Browser    chromium    headless=True
    ${video_width} =    Evaluate    int(${width}) * int(${scale})
    ${video_height} =    Evaluate    int(${height}) * int(${scale})
    New Context
    ...    viewport={'width': ${width}, 'height': ${height}}
    ...    deviceScaleFactor=${scale}
    ...    recordVideo={'dir': '${RAW}', 'size': {'width': ${video_width}, 'height': ${video_height}}}
    ...    colorScheme=light
    Add Video Helpers    ${toolbar_x}    ${toolbar_y}
    ${page} =    New Page    ${url}
    ${centre_x} =    Evaluate    int(${width}) / 2
    ${centre_y} =    Evaluate    int(${height}) / 2
    Mouse Move    ${centre_x}    ${centre_y}
    RETURN    ${page}[video_path]

Save Video As
    [Documentation]    Closes the context, which writes the video, and keeps it under ``name``.
    [Arguments]    ${video}    ${name}
    Close Context
    Move File    ${video}    ${RAW}/${name}.webm

Glide To
    [Arguments]    ${x}    ${y}
    Mouse Move    ${x}    ${y}    steps=25
    Sleep    0.25s

Point At
    [Arguments]    ${selector}
    ${box} =    Get BoundingBox    ${selector}
    ${x} =    Evaluate    $box['x'] + $box['width'] / 2
    ${y} =    Evaluate    $box['y'] + $box['height'] / 2
    Glide To    ${x}    ${y}

Click Slowly
    [Arguments]    ${selector}
    Point At    ${selector}
    Mouse Button    click
    Sleep    0.6s

Point At Toolbar
    [Arguments]    ${finder}
    ${point} =    Evaluate JavaScript    ${None}
    ...    () => { const r = (${finder})().getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }
    Glide To    ${point}[0]    ${point}[1]

Click Toolbar
    [Documentation]    ``finder`` is a JavaScript function returning an element of the toolbar.
    [Arguments]    ${finder}
    Point At Toolbar    ${finder}
    Mouse Button    click
    Sleep    0.6s

Click Toolbar Button
    [Arguments]    ${id}
    Click Toolbar    () => window.toolbarRoot.getElementById('${id}')

Type Slowly
    [Arguments]    ${text}
    Keyboard Input    type    ${text}    delay=90ms
    Sleep    0.4s

Wait For Toolbar
    Wait For Function    () => !!window.toolbarRoot && !!window.__rfbToolbarState

Wait For Recording
    Wait For Function    () => window.__rfbToolbarState && window.__rfbToolbarState.state === 'recording' && !window.__rfbToolbarState.pending

End A Failed Session
    [Documentation]    Test teardown: a failed script must not leave a session waiting for its idle timeout.
    Run Keyword And Ignore Error    Evaluate JavaScript    ${None}    () => window.__rfbCommand({cmd: 'stop'})

Save Loop As
    [Documentation]    Ends a loop with the toolbar still in view: closing the page ends the
    ...    session (all pages closed), so no ✕ click is in the video.
    [Arguments]    ${video}    ${name}    ${recording}
    Sleep    1.5s
    Close Page
    Wait For    ${recording}
    Close Context
    Move File    ${video}    ${RAW}/${name}.webm

Make Argument Of Value
    [Documentation]    Opens the argument dialog on the ``index``-th selectable value and names it.
    [Arguments]    ${index}    ${name}    ${keep_default}=${True}
    Click Toolbar    () => window.toolbarRoot.querySelectorAll('.cell.pick')[${index}]
    Sleep    0.5s
    Click Toolbar Button    argName
    Type Slowly    ${name}
    IF    not ${keep_default}    Click Toolbar Button    argDefault
    Sleep    0.4s
    Click Toolbar Button    argOk
    Sleep    0.8s
