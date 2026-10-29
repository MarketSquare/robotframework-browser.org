*** Settings ***
Documentation       Record Keyword: one keyword, recorded from where the test stands.
Resource            video.resource

Test Teardown       End A Failed Session


*** Test Cases ***
Quick Start
    ${video} =    Open Video Page    ${SITE}
    Sleep    1s
    ${recording} =    Promise To    Record Keyword    Find The Get Text Keyword    ${RAW}/quick-start.resource    idle_timeout=1 minute
    Wait For Toolbar
    Wait For Recording
    Sleep    1s
    Click Slowly    header >> role=link[name="Keywords"]
    Click Slowly    input[type="search"]
    Type Slowly    Get Text
    Sleep    1s
    Click Slowly    nav.rail >> a.rail-kw >> text=Get Text
    Sleep    2.5s
    Click Toolbar Button    stop
    Wait For    ${recording}
    Sleep    1.5s
    Save Video As    ${video}    quick-start
