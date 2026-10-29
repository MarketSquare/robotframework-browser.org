*** Settings ***
Documentation       Loop: what is typed while paused stays out of the keyword.
Resource            video.resource

Test Teardown       End A Failed Session


*** Variables ***
${CAR}      http://car.keyword-driven.de


*** Test Cases ***
Loop Pause
    # Right of the login form; render.sh crops the video to form and toolbar.
    ${video} =    Open Video Page    ${CAR}    toolbar_x=780    toolbar_y=40
    ${recording} =    Promise To    Record Keyword    Log In Later    ${RAW}/loop-pause.resource
    ...    idle_timeout=1 minute
    Wait For Toolbar
    Wait For Recording
    Click Slowly    id=input_username
    Type Slowly    demo
    Sleep    0.5s
    Click Toolbar Button    pause
    Wait For Function    () => window.__rfbToolbarState.paused === true && !window.__rfbToolbarState.pending
    Click Slowly    id=input_password
    Type Slowly    not recorded
    Sleep    0.5s
    Click Toolbar Button    resume
    Wait For Function    () => window.__rfbToolbarState.paused === false && !window.__rfbToolbarState.pending
    Click Slowly    id=button_login
    Wait For Function    () => window.__rfbToolbarState.calls.length === 3
    Save Loop As    ${video}    loop-pause    ${recording}
