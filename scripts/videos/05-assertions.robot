*** Settings ***
Documentation       Assertions with Playwright's own toolbar: visibility and text.
...                 Its buttons sit in a closed shadow root at the top centre, so they are clicked by position.
Resource            video.resource

Test Teardown       End A Failed Session


*** Variables ***
${ASSERT_VISIBLE}       744
${ASSERT_TEXT}          776
${TOOLS_Y}              16


*** Test Cases ***
Assertions
    ${video} =    Open Video Page    ${SITE}/docs/concepts/assertions
    Sleep    1s
    ${recording} =    Promise To    Record Keyword    Check The Assertions Page    ${RAW}/assertions.resource
    ...    idle_timeout=1 minute
    Wait For Toolbar
    Wait For Recording
    Sleep    0.8s
    Glide To    ${ASSERT_VISIBLE}    ${TOOLS_Y}
    Mouse Button    click
    Sleep    0.5s
    Click Slowly    main h1
    Wait For Function    () => window.__rfbToolbarState.calls.length === 1
    Sleep    1.2s
    Glide To    ${ASSERT_TEXT}    ${TOOLS_Y}
    Mouse Button    click
    Sleep    0.5s
    Click Slowly    main h1
    Sleep    1.2s
    # The ✓ of Playwright's text dialog, which opens below the heading.
    ${box} =    Get BoundingBox    main h1
    ${x} =    Evaluate    $box['x'] + 358
    ${y} =    Evaluate    $box['y'] + $box['height'] + 22
    Glide To    ${x}    ${y}
    Mouse Button    click
    Wait For Function    () => window.__rfbToolbarState.calls.length === 2
    Sleep    2.5s
    Click Toolbar Button    stop
    Wait For    ${recording}
    Sleep    1s
    Save Video As    ${video}    assertions
