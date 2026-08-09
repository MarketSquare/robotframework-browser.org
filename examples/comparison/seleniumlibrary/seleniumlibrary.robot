*** Settings ***
Library     SeleniumLibrary


*** Test Cases ***
Test Eight Components
    Open Browser    https://www.selenium.dev/selenium/web/web-form.html    chrome
    Title Should Be    Web form
    Input Text    name:my-text    Selenium
    Click Button    css:button
    Wait Until Element Is Visible    id:message
    Element Text Should Be    id:message    Received!
    [Teardown]    Close Browser
