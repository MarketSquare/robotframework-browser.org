*** Settings ***
Documentation       Loop: a login recorded live on car.keyword-driven.de.
Resource            video.resource

Test Teardown       End A Failed Session


*** Variables ***
${CAR}      http://car.keyword-driven.de


*** Test Cases ***
Loop Login
    # Right of the login form; render.sh crops the video to form and toolbar.
    ${video} =    Open Video Page    ${CAR}    toolbar_x=780    toolbar_y=40
    ${recording} =    Promise To    Record Keyword    Log In    ${RAW}/loop-login.resource
    ...    idle_timeout=1 minute
    Wait For Toolbar
    Wait For Recording
    Sleep    0.5s
    Click Slowly    id=input_username
    Type Slowly    demo
    Click Slowly    id=input_password
    Type Slowly    secret
    Click Slowly    id=button_login
    Wait For Function    () => window.__rfbToolbarState.calls.length === 5
    Save Loop As    ${video}    loop-login    ${recording}
